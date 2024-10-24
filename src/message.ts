export enum ProcessStage {
  READY = 'ready',
  INFERING ='infering',
  LOADING = 'loading',
  SEARCHING = 'searching',
  THINKING = 'thinking',
  REASONING = 'reasoning',
  ANSWERING = 'answering',
}

export enum MessageType {
  HUMAN = 'human',
  AI = 'ai',
}


export class Message {
  public constructor(
    public readonly type: MessageType,
    public readonly stage: ProcessStage,
    public readonly message: string
  ) {
  }

  toJSON() {
    return {
      type: this.type,
      stage: this.stage,
      message: this.message,
    }
  }
}
