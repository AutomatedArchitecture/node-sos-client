
interface SosDeviceInfo {
    version: number;
    hardwareType: number;
    hardwareVersion: number;
    externalMemorySize: number;
    audioMode: number;
    audioPlayDuration: number;
    ledMode: number;
    ledPlayDuration: number;
}

interface SosDeviceControlPacket {
    ledMode?: number;
    ledPlayDuration?: number;
    audioMode?: number;
    audioPlayDuration?: number;
    manualLeds0?: number;
    manualLeds1?: number;
    manualLeds2?: number;
    manualLeds3?: number;
    manualLeds4?: number;
}

interface SosDeviceLedPattern {
    id: number;
    name: string;
}

interface SosDeviceAudioPattern {
    id: number;
    name: string;
}

interface SosDeviceAllInfo extends SosDeviceInfo {
    ledPatterns: SosDeviceLedPattern[];
    audioPatterns: SosDeviceAudioPattern[];
}

interface SosDevice {
    readInfo(callback: (err?: Error, deviceInfo?: SosDeviceInfo) => void): void;
    readAllInfo(callback: (err?: Error, allInfo?: SosDeviceAllInfo) => void): void;
    sendControlPacket(controlPacket: SosDeviceControlPacket, callback?: (err?: Error) => void): void;
    readLedPatterns(callback: (err?: Error, ledPatters?: SosDeviceLedPattern[]) => void): void;
    readAudioPatterns(callback: (err?: Error, audioPatters?: SosDeviceAudioPattern[]) => void): void;
}

declare module "sos-device" {
    function connect(callback: (err?: Error, sosDevice?: SosDevice) => void): void;
}

