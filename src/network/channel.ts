export interface INetworkChannel {
  /** Deliver message to target device. */
  send(payload: any): void;

  /** Register the one-and-only listener for incoming messages. */
  setOnRecv(listener: (payload: any) => void): void;
}
