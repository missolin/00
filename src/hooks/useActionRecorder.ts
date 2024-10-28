import { useState, useCallback, useRef } from 'react';
import { RecordedAction, ActionRecord } from '../types';

export const useActionRecorder = (url: string) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMouseMode, setIsMouseMode] = useState(true);
  const recordRef = useRef<ActionRecord>({ actions: [], startTime: 0, url });
  const playbackTimeoutRef = useRef<NodeJS.Timeout[]>([]);

  const startRecording = useCallback(() => {
    recordRef.current = {
      actions: [],
      startTime: Date.now(),
      url
    };
    setIsRecording(true);
  }, [url]);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
  }, []);

  const recordAction = useCallback((action: RecordedAction) => {
    if (isRecording) {
      recordRef.current.actions.push(action);
    }
  }, [isRecording]);

  const clearPlaybackTimeouts = useCallback(() => {
    playbackTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
    playbackTimeoutRef.current = [];
  }, []);

  const playActions = useCallback((iframe: HTMLIFrameElement | null, actionRecord: ActionRecord) => {
    if (!iframe || isPlaying || actionRecord.actions.length === 0) return;

    setIsPlaying(true);
    const iframeWindow = iframe.contentWindow;
    const iframeDocument = iframe.contentDocument;

    if (!iframeWindow || !iframeDocument) {
      setIsPlaying(false);
      return;
    }

    const timeouts: NodeJS.Timeout[] = [];

    actionRecord.actions.forEach(action => {
      const timeout = setTimeout(() => {
        if (action.type === 'mouse' && action.data.x !== undefined && action.data.y !== undefined) {
          const event = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            clientX: action.data.x,
            clientY: action.data.y
          });
          const element = iframeDocument.elementFromPoint(action.data.x, action.data.y);
          element?.dispatchEvent(event);
        } else if (action.type === 'keyboard' && action.data.key) {
          const event = new KeyboardEvent('keydown', {
            key: action.data.key,
            code: action.data.code || '',
            bubbles: true,
            cancelable: true
          });
          iframeDocument.activeElement?.dispatchEvent(event);
        }
      }, action.timestamp - actionRecord.startTime);

      timeouts.push(timeout);
    });

    playbackTimeoutRef.current = timeouts;

    const finalTimeout = setTimeout(() => {
      setIsPlaying(false);
      clearPlaybackTimeouts();
    }, actionRecord.actions[actionRecord.actions.length - 1].timestamp - actionRecord.startTime + 100);

    timeouts.push(finalTimeout);
  }, [clearPlaybackTimeouts, isPlaying]);

  const toggleMode = useCallback(() => {
    setIsMouseMode(prev => !prev);
  }, []);

  return {
    isRecording,
    isPlaying,
    isMouseMode,
    startRecording,
    stopRecording,
    recordAction,
    playActions,
    toggleMode,
    clearPlaybackTimeouts,
    currentRecord: recordRef.current
  };
};