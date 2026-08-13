export type DeviceConnectionStatus = 'idle' | 'scanning' | 'paired' | 'disconnected';

export type SomnGuardDevice = {
  id: string;
  name: string;
  firmwareVersion?: string;
};


