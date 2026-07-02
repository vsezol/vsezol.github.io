import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import './styles/chat.css';

import { MantineProvider, createTheme } from '@mantine/core';
import ChatApp from './components/ChatApp';

const theme = createTheme({
  primaryColor: 'blue',
  defaultRadius: 'md',
});

export default function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <ChatApp />
    </MantineProvider>
  );
}
