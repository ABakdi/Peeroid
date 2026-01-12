export class PeeroidError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'PeeroidError';
  }
}

export class ModuleNotReadyError extends PeeroidError {
  constructor(module: string) {
    super(`${module} module not ready`, 'MODULE_NOT_READY', { module });
    this.name = 'ModuleNotReadyError';
  }
}

export class ConnectionError extends PeeroidError {
  constructor(message: string, public readonly peerId?: string) {
    super(message, 'CONNECTION_ERROR', { peerId });
    this.name = 'ConnectionError';
  }
}

export class ProtocolError extends PeeroidError {
  constructor(protocolId: string, message: string) {
    super(`Protocol ${protocolId}: ${message}`, 'PROTOCOL_ERROR', { protocolId });
    this.name = 'ProtocolError';
  }
}
