import React, { useRef, useState, useCallback } from 'react';
import { Paper, IconButton, Typography, Stack, Tooltip, Button, Divider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import RefreshIcon from '@mui/icons-material/Refresh';
import MouseIcon from '@mui/icons-material/Mouse';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import { WebWindowProps } from '../types';
import { useActionRecorder } from '../hooks/useActionRecorder';

const WebWindow: React.FC<WebWindowProps> = ({ 
  url, 
  title, 
  onClose, 
  isController,
  onSetController,
  controllerActions,
  onRecordComplete
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loadError, setLoadError] = useState(false);
  const [key, setKey] = useState(0);
  
  const {
    isRecording,
    isPlaying,
    isMouseMode,
    startRecording,
    stopRecording,
    recordAction,
    playActions,
    toggleMode,
    clearPlaybackTimeouts,
    currentRecord
  } = useActionRecorder(url);

  const handleRefresh = useCallback(() => {
    setKey(prev => prev + 1);
    setLoadError(false);
    clearPlaybackTimeouts();
  }, [clearPlaybackTimeouts]);

  const handleOpenInNew = () => {
    window.open(url, '_blank');
  };

  const handleIframeError = () => {
    setLoadError(true);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
      if (onRecordComplete && currentRecord) {
        onRecordComplete(currentRecord);
      }
    } else {
      startRecording();
    }
  };

  const handlePlayback = () => {
    if (controllerActions) {
      playActions(iframeRef.current, controllerActions);
    }
  };

  const handleIframeLoad = () => {
    const iframe = iframeRef.current;
    if (iframe) {
      try {
        const iframeDoc = iframe.contentWindow?.document;
        if (iframeDoc) {
          iframeDoc.addEventListener('click', (e) => {
            if (isRecording && isMouseMode) {
              recordAction({
                type: 'mouse',
                timestamp: Date.now(),
                data: {
                  x: e.clientX,
                  y: e.clientY,
                  target: (e.target as HTMLElement).tagName
                }
              });
            }
          });

          iframeDoc.addEventListener('keydown', (e) => {
            if (isRecording && !isMouseMode) {
              recordAction({
                type: 'keyboard',
                timestamp: Date.now(),
                data: {
                  key: e.key,
                  code: e.code,
                  target: (e.target as HTMLElement).tagName
                }
              });
            }
          });
        }
      } catch (error) {
        console.warn('无法访问iframe内容:', error);
      }
    }
  };

  return (
    <Paper 
      elevation={3} 
      sx={{
        height: '100%',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        overflow: 'hidden',
        border: isController ? '2px solid #ffd700' : 'none',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div 
        style={{
          padding: '8px',
          backgroundColor: isController ? '#fff3bf' : '#f5f5f5',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #e0e0e0'
        }}
      >
        <Typography variant="subtitle1" noWrap sx={{ maxWidth: '200px' }}>
          {title}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          {isController ? (
            <Tooltip title={isRecording ? "停止录制" : "开始录制"}>
              <IconButton 
                size="small" 
                onClick={toggleRecording}
                color={isRecording ? "error" : "default"}
                disabled={isPlaying}
              >
                {isRecording ? <StopIcon /> : <PlayArrowIcon />}
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="同步主控窗口操作">
              <IconButton 
                size="small" 
                onClick={handlePlayback}
                disabled={!controllerActions || isPlaying}
                color={isPlaying ? "primary" : "default"}
              >
                <PlayCircleIcon />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={isMouseMode ? "当前：鼠标模式" : "当前：键盘模式"}>
            <IconButton 
              size="small" 
              onClick={toggleMode}
              color={isMouseMode ? "primary" : "default"}
              disabled={isPlaying || (!isController && !controllerActions)}
            >
              {isMouseMode ? <MouseIcon /> : <KeyboardIcon />}
            </IconButton>
          </Tooltip>
          <Divider orientation="vertical" flexItem />
          <Tooltip title="在新窗口打开">
            <IconButton size="small" onClick={handleOpenInNew}>
              <OpenInNewIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="刷新">
            <IconButton size="small" onClick={handleRefresh}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          {onSetController && (
            <Tooltip title={isController ? "当前为主控窗口" : "设为主控窗口"}>
              <IconButton 
                size="small" 
                onClick={onSetController}
                color={isController ? "warning" : "default"}
              >
                {isController ? <StarIcon /> : <StarBorderIcon />}
              </IconButton>
            </Tooltip>
          )}
          <IconButton 
            size="small" 
            onClick={onClose}
            sx={{ 
              '&:hover': { 
                backgroundColor: 'rgba(0, 0, 0, 0.04)' 
              } 
            }}
          >
            <CloseIcon />
          </IconButton>
        </Stack>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        {loadError ? (
          <Stack
            spacing={2}
            alignItems="center"
            justifyContent="center"
            sx={{
              height: '100%',
              p: 2,
              bgcolor: '#f8f9fa'
            }}
          >
            <Typography color="error" align="center">
              无法在框架中加载此网站
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              这可能是由于网站的安全策略限制
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
              >
                重试
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<OpenInNewIcon />}
                onClick={handleOpenInNew}
              >
                在新窗口打开
              </Button>
            </Stack>
          </Stack>
        ) : (
          <iframe
            key={key}
            ref={iframeRef}
            src={url}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: '#ffffff'
            }}
            title={title}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            loading="lazy"
            onError={handleIframeError}
            onLoad={handleIframeLoad}
          />
        )}
      </div>
    </Paper>
  );
};

export default WebWindow;