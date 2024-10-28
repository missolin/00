import React, { useState, useCallback } from 'react';
import { 
  Button, 
  TextField, 
  Container, 
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Stack,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Input,
  InputAdornment,
  Grid
} from '@mui/material';
import WebWindow from './components/WebWindow';
import { Website, ActionRecord } from './types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function App() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [open, setOpen] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [batchUrl, setBatchUrl] = useState('');
  const [batchCount, setBatchCount] = useState('1');
  const [controllerActions, setControllerActions] = useState<ActionRecord | null>(null);

  const validateUrl = (url: string): string => {
    try {
      return url.startsWith('http') ? url : `https://${url}`;
    } catch (err) {
      throw new Error('无效的网址');
    }
  };

  const handleAddSingleWebsite = () => {
    if (!newTitle.trim()) {
      setError('请输入网站标题');
      return;
    }

    if (!newUrl.trim()) {
      setError('请输入网站地址');
      return;
    }

    try {
      const finalUrl = validateUrl(newUrl);
      new URL(finalUrl);

      setWebsites(prev => [...prev, {
        id: Date.now().toString(),
        url: finalUrl,
        title: newTitle.trim(),
        isController: prev.length === 0
      }]);
      
      setNewUrl('');
      setNewTitle('');
      setError(null);
      setOpen(false);
    } catch (err) {
      setError('请输入有效的网址');
    }
  };

  const handleBatchAdd = () => {
    if (!batchUrl.trim()) {
      setError('请输入网站地址');
      return;
    }

    const count = parseInt(batchCount);
    if (isNaN(count) || count < 1 || count > 100) {
      setError('请输入1-100之间的数量');
      return;
    }

    try {
      const baseUrl = validateUrl(batchUrl);
      new URL(baseUrl);
      
      const newWebsites: Website[] = Array.from({ length: count }, (_, index) => ({
        id: `${Date.now()}-${index}`,
        url: baseUrl,
        title: `窗口 ${index + 1}`,
        isController: websites.length === 0 && index === 0
      }));

      setWebsites(prev => [...prev, ...newWebsites]);
      setBatchUrl('');
      setBatchCount('1');
      setError(null);
      setOpen(false);
    } catch (err) {
      setError('请输入有效的网址');
    }
  };

  const handleRemoveWebsite = (id: string) => {
    setWebsites(prevWebsites => {
      const removedWebsite = prevWebsites.find(w => w.id === id);
      const newWebsites = prevWebsites.filter(w => w.id !== id);
      
      if (removedWebsite?.isController && newWebsites.length > 0) {
        return newWebsites.map((w, index) => 
          index === 0 ? { ...w, isController: true } : w
        );
      }
      
      return newWebsites;
    });
    setControllerActions(null);
  };

  const handleSetController = useCallback((id: string) => {
    setWebsites(prevWebsites =>
      prevWebsites.map(website => ({
        ...website,
        isController: website.id === id
      }))
    );
  }, []);

  const handleRecordComplete = useCallback((record: ActionRecord) => {
    setControllerActions(record);
  }, []);

  const handleClose = () => {
    setOpen(false);
    setNewUrl('');
    setNewTitle('');
    setBatchUrl('');
    setBatchCount('1');
    setError(null);
    setTabValue(0);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" component="h1">
            多网站管理器
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => setOpen(true)}
          >
            添加网站
          </Button>
        </Stack>

        <Dialog 
          open={open} 
          onClose={handleClose}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>添加新网站</DialogTitle>
          <DialogContent>
            <Tabs
              value={tabValue}
              onChange={(_, newValue) => setTabValue(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="单个添加" />
              <Tab label="批量添加" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              <TextField
                autoFocus
                margin="dense"
                label="网站标题"
                fullWidth
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                error={error === '请输入网站标题'}
                helperText={error === '请输入网站标题' ? error : ''}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label="网站地址"
                fullWidth
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="例如: www.example.com"
                error={error === '请输入网站地址' || error === '请输入有效的网址'}
                helperText={error === '请输入网站地址' || error === '请输入有效的网址' ? error : ''}
              />
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <TextField
                margin="dense"
                label="网站地址"
                fullWidth
                value={batchUrl}
                onChange={(e) => setBatchUrl(e.target.value)}
                placeholder="例如: www.example.com"
                error={error === '请输入网站地址' || error === '请输入有效的网址'}
                helperText={error === '请输入网站地址' || error === '请输入有效的网址' ? error : ''}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth variant="standard">
                <InputLabel htmlFor="batch-count">窗口数量</InputLabel>
                <Input
                  id="batch-count"
                  type="number"
                  value={batchCount}
                  onChange={(e) => setBatchCount(e.target.value)}
                  inputProps={{ min: 1, max: 100 }}
                  error={error === '请输入1-100之间的数量'}
                  endAdornment={<InputAdornment position="end">个</InputAdornment>}
                />
              </FormControl>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                将创建指定数量的窗口，标题自动编号
              </Typography>
            </TabPanel>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>取消</Button>
            <Button 
              onClick={tabValue === 0 ? handleAddSingleWebsite : handleBatchAdd}
              variant="contained"
            >
              添加
            </Button>
          </DialogActions>
        </Dialog>

        <Box 
          sx={{ 
            height: 'calc(100vh - 200px)',
            bgcolor: '#f5f5f5',
            borderRadius: 2,
            p: 2,
            overflow: 'auto'
          }}
        >
          {websites.length > 0 ? (
            <Grid container spacing={2} sx={{ height: '100%' }}>
              {websites.map((website) => (
                <Grid item xs={12} md={6} lg={4} key={website.id} sx={{ height: '500px' }}>
                  <WebWindow
                    url={website.url}
                    title={website.title}
                    isController={website.isController}
                    onClose={() => handleRemoveWebsite(website.id)}
                    onSetController={() => handleSetController(website.id)}
                    controllerActions={website.isController ? null : controllerActions}
                    onRecordComplete={website.isController ? handleRecordComplete : undefined}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ 
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%, -50%)',
                textAlign: 'center'
              }}
            >
              点击"添加网站"按钮开始添加网站
            </Typography>
          )}
        </Box>
      </Box>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert 
          severity="error" 
          onClose={() => setError(null)}
          sx={{ whiteSpace: 'pre-line' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default App;