import { PrinterConfig, Transaction } from '../types';
import { generateEscPosReceipt, generateTestReceipt } from './escpos';

// Common Bluetooth Printer Service UUIDs
const BLUETOOTH_PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard Printer service
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC
  '0000ff00-0000-1000-8000-00805f9b34fb', // General SPP / Vendor
  '00001101-0000-1000-8000-00805f9b34fb', // Serial Port Profile
];

// Helper to chunk data for Bluetooth transfers
async function sendInChunks(
  characteristic: BluetoothRemoteGATTCharacteristic,
  data: Uint8Array,
  chunkSize: number = 100
) {
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    if ('writeValueWithoutResponse' in characteristic && typeof characteristic.writeValueWithoutResponse === 'function') {
      await characteristic.writeValueWithoutResponse(chunk);
    } else {
      await characteristic.writeValue(chunk);
    }
    // Small delay between chunks to prevent buffer overflow on mobile thermal printers
    await new Promise((resolve) => setTimeout(resolve, 30));
  }
}

class PrinterService {
  private bluetoothDevice: BluetoothDevice | null = null;
  private bluetoothCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private serialPort: SerialPort | null = null;
  private serialWriter: WritableStreamDefaultWriter<Uint8Array> | null = null;

  public config: PrinterConfig = {
    type: 'bluetooth',
    paperWidth: 58,
    connected: false,
    autoCut: true,
    openDrawer: false,
    printDensity: 'normal',
  };

  private listeners: Array<(config: PrinterConfig) => void> = [];

  constructor() {
    this.loadSavedConfig();
  }

  private loadSavedConfig() {
    try {
      const saved = localStorage.getItem('wigata_printer_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.config = {
          ...this.config,
          ...parsed,
          connected: false, // Connection must be re-established per session
        };
      }
    } catch (e) {
      console.warn('Failed to load printer config', e);
    }
  }

  public saveConfig(newConfig: Partial<PrinterConfig>) {
    this.config = { ...this.config, ...newConfig };
    try {
      localStorage.setItem(
        'wigata_printer_config',
        JSON.stringify({
          type: this.config.type,
          paperWidth: this.config.paperWidth,
          autoCut: this.config.autoCut,
          openDrawer: this.config.openDrawer,
          deviceName: this.config.deviceName,
        })
      );
    } catch (e) {
      console.warn('Failed to save printer config', e);
    }
    this.notify();
  }

  public subscribe(listener: (config: PrinterConfig) => void) {
    this.listeners.push(listener);
    listener(this.config);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l(this.config));
  }

  public isBluetoothSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  public isSerialSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  // Connect Bluetooth Thermal Printer
  public async connectBluetooth(): Promise<{ success: boolean; deviceName?: string; error?: string }> {
    if (!this.isBluetoothSupported()) {
      return { success: false, error: 'Browser ini belum mendukung Web Bluetooth. Gunakan Google Chrome di Android atau Desktop.' };
    }

    try {
      // Disconnect previous if any
      await this.disconnect();

      if (!navigator.bluetooth) {
        throw new Error('Web Bluetooth tidak tersedia di browser ini');
      }

      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: BLUETOOTH_PRINTER_SERVICES,
      });

      if (!device.gatt) {
        throw new Error('GATT server tidak ditemukan pada perangkat Bluetooth');
      }

      const server = await device.gatt.connect();

      // Find suitable service and write characteristic
      let writeChar: BluetoothRemoteGATTCharacteristic | null = null;

      // Try known services first
      const services = await server.getPrimaryServices().catch(() => []);
      for (const service of services) {
        try {
          const characteristics = await service.getCharacteristics();
          for (const char of characteristics) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              writeChar = char;
              break;
            }
          }
        } catch {
          // continue searching
        }
        if (writeChar) break;
      }

      if (!writeChar) {
        throw new Error('Karakteristik cetak (Write) tidak ditemukan pada printer Bluetooth');
      }

      this.bluetoothDevice = device;
      this.bluetoothCharacteristic = writeChar;

      device.addEventListener('gattserverdisconnected', () => {
        this.config.connected = false;
        this.notify();
      });

      this.saveConfig({
        connected: true,
        type: 'bluetooth',
        deviceName: device.name || 'Bluetooth Thermal Printer',
      });

      return { success: true, deviceName: device.name || 'Bluetooth Printer' };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Gagal menghubungkan Bluetooth';
      return { success: false, error: errorMsg };
    }
  }

  // Connect USB Cable / Serial Port Thermal Printer
  public async connectSerial(baudRate: number = 9600): Promise<{ success: boolean; deviceName?: string; error?: string }> {
    if (!this.isSerialSupported()) {
      return { success: false, error: 'Browser ini belum mendukung Web Serial (Kabel USB). Gunakan Google Chrome / Microsoft Edge di PC/Laptop/OTG.' };
    }

    try {
      await this.disconnect();

      if (!navigator.serial) {
        throw new Error('Web Serial tidak tersedia di browser ini');
      }

      const port = await navigator.serial.requestPort();
      await port.open({ baudRate });

      this.serialPort = port;
      this.serialWriter = port.writable ? port.writable.getWriter() : null;

      if (!this.serialWriter) {
        throw new Error('Tidak dapat membuka port penulisan serial USB');
      }

      const info = port.getInfo();
      const deviceName = info.usbVendorId ? `USB Thermal Printer (${info.usbVendorId.toString(16)})` : 'USB Thermal Printer Kabel';

      this.saveConfig({
        connected: true,
        type: 'serial',
        deviceName,
      });

      return { success: true, deviceName };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Gagal menghubungkan kabel USB printer';
      return { success: false, error: errorMsg };
    }
  }

  // Disconnect active printer
  public async disconnect(): Promise<void> {
    if (this.bluetoothDevice && this.bluetoothDevice.gatt?.connected) {
      this.bluetoothDevice.gatt.disconnect();
    }
    this.bluetoothDevice = null;
    this.bluetoothCharacteristic = null;

    if (this.serialWriter) {
      try {
        await this.serialWriter.close();
      } catch {
        // ignore
      }
      this.serialWriter = null;
    }
    if (this.serialPort) {
      try {
        await this.serialPort.close();
      } catch {
        // ignore
      }
      this.serialPort = null;
    }

    this.saveConfig({ connected: false });
  }

  // Send raw ESC/POS bytes to the connected printer
  public async sendRaw(data: Uint8Array): Promise<{ success: boolean; error?: string }> {
    if (this.config.type === 'bluetooth') {
      if (!this.bluetoothCharacteristic) {
        return { success: false, error: 'Printer Bluetooth belum terhubung' };
      }
      try {
        await sendInChunks(this.bluetoothCharacteristic, data, 100);
        return { success: true };
      } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Gagal mengirim data ke Bluetooth' };
      }
    } else if (this.config.type === 'serial') {
      if (!this.serialWriter) {
        return { success: false, error: 'Printer Kabel USB belum terhubung' };
      }
      try {
        await this.serialWriter.write(data);
        return { success: true };
      } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Gagal mengirim data ke USB Serial' };
      }
    }

    return { success: false, error: 'Metode printer tidak valid' };
  }

  // Print a transaction
  public async printTransaction(transaction: Transaction): Promise<{ success: boolean; error?: string }> {
    const rawBytes = generateEscPosReceipt(transaction, this.config.paperWidth, {
      cut: this.config.autoCut,
      openDrawer: this.config.openDrawer,
    });
    return this.sendRaw(rawBytes);
  }

  // Print test receipt
  public async printTest(): Promise<{ success: boolean; error?: string }> {
    const rawBytes = generateTestReceipt(this.config.paperWidth);
    return this.sendRaw(rawBytes);
  }
}

export const printerService = new PrinterService();
