export interface Website {
  id: string;
  url: string;
  title: string;
  isController?: boolean;
}

export interface WebWindowProps {
  url: string;
  title: string;
  onClose: () => void;
  isController?: boolean;
  onSetController?: () => void;
  controllerActions?: ActionRecord | null;
  onRecordComplete?: (record: ActionRecord) => void;
}

export interface RecordedAction {
  type: 'mouse' | 'keyboard';
  timestamp: number;
  data: {
    x?: number;
    y?: number;
    key?: string;
    code?: string;
    target?: string;
  };
}

export interface ActionRecord {
  actions: RecordedAction[];
  startTime: number;
  url: string;
}