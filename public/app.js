(() => {
  const statusIndicator = document.getElementById('status-indicator');
  const statusText = document.getElementById('status-text');
  const messageList = document.getElementById('message-list');
  const messageForm = document.getElementById('message-form');
  const messageInput = document.getElementById('message-input');
  const messageTemplate = document.getElementById('message-template');
  const nameDialog = document.getElementById('name-dialog');
  const nameForm = document.getElementById('name-form');
  const nameInput = document.getElementById('name-input');
  const cancelNameButton = document.getElementById('cancel-name');
  const changeNameButton = document.getElementById('change-name');
  const profileName = document.getElementById('profile-name');
  const profileAvatar = document.getElementById('profile-avatar');

  let username = localStorage.getItem('super-system-username') || '';
  let eventSource;
  let historyLoaded = false;

  function updateStatus(type, text) {
    statusIndicator.classList.remove('status-online', 'status-offline');
    if (type === 'online') {
      statusIndicator.classList.add('status-online');
    } else if (type === 'offline') {
      statusIndicator.classList.add('status-offline');
    }
    statusText.textContent = text;
  }

  function avatarInitials(name) {
    if (!name) return '?';
    const trimmed = name.trim();
    if (!trimmed) return '?';
    return trimmed.slice(0, 1).toUpperCase();
  }

  function setUsername(name) {
    username = name.trim();
    if (username) {
      localStorage.setItem('super-system-username', username);
      profileName.textContent = username;
    } else {
      localStorage.removeItem('super-system-username');
      profileName.textContent = '未命名用户';
    }
    profileAvatar.textContent = avatarInitials(username);
  }

  function ensureUsername() {
    if (username) {
      profileAvatar.textContent = avatarInitials(username);
      profileName.textContent = username;
      return;
    }

    openNameDialog();
  }

  function openNameDialog() {
    if (typeof nameDialog?.showModal === 'function') {
      nameInput.value = username;
      nameDialog.showModal();
      setTimeout(() => nameInput.focus(), 50);
    } else {
      const result = window.prompt('请输入你的昵称：', username || '');
      if (result !== null) {
        const trimmed = result.trim().slice(0, 32);
        if (trimmed) {
          setUsername(trimmed);
        }
      }
    }
  }

  cancelNameButton?.addEventListener('click', () => {
    if (typeof nameDialog?.close === 'function') {
      nameDialog.close();
    }
  });

  nameForm?.addEventListener('submit', event => {
    event.preventDefault();
    const value = nameInput.value.trim().slice(0, 32);
    if (value) {
      setUsername(value);
      if (typeof nameDialog?.close === 'function') {
        nameDialog.close();
      }
    }
  });

  changeNameButton?.addEventListener('click', () => {
    openNameDialog();
  });

  function formatTimestamp(timestamp) {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return '';
    }
  }

  function createMessageElement(message) {
    const clone = messageTemplate.content.firstElementChild.cloneNode(true);
    const author = clone.querySelector('.author');
    const time = clone.querySelector('.time');
    const content = clone.querySelector('.content');
    author.textContent = message.user || '匿名用户';
    time.textContent = formatTimestamp(message.timestamp);
    content.textContent = message.text;
    if (username && message.user === username) {
      clone.classList.add('self');
    }
    return clone;
  }

  function renderMessages(messages) {
    const fragment = document.createDocumentFragment();
    for (const message of messages) {
      fragment.appendChild(createMessageElement(message));
    }
    messageList.innerHTML = '';
    messageList.appendChild(fragment);
    messageList.scrollTop = messageList.scrollHeight;
  }

  function appendMessage(message) {
    messageList.appendChild(createMessageElement(message));
    messageList.scrollTop = messageList.scrollHeight;
  }

  function connect() {
    if (eventSource) {
      eventSource.close();
    }

    updateStatus('offline', '正在连接...');
    eventSource = new EventSource('/events');

    eventSource.addEventListener('open', () => {
      updateStatus('online', '已连接');
    });

    eventSource.addEventListener('error', () => {
      updateStatus('offline', '连接异常，正在重试...');
    });

    eventSource.addEventListener('history', event => {
      try {
        const payload = JSON.parse(event.data || '[]');
        renderMessages(payload);
        historyLoaded = true;
      } catch (error) {
        console.error('无法解析历史记录', error);
      }
    });

    eventSource.addEventListener('message', event => {
      try {
        const payload = JSON.parse(event.data || '{}');
        if (!historyLoaded) {
          return;
        }
        appendMessage(payload);
      } catch (error) {
        console.error('无法解析消息', error);
      }
    });
  }

  messageForm?.addEventListener('submit', async event => {
    event.preventDefault();
    const text = messageInput.value.trim();
    if (!text) {
      return;
    }

    const payload = {
      user: username || '匿名用户',
      text
    };

    messageForm.classList.add('pending');
    try {
      const response = await fetch('/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        updateStatus('offline', result.error || '发送失败，请稍后再试');
      } else {
        messageInput.value = '';
        updateStatus('online', '已连接');
      }
    } catch (error) {
      updateStatus('offline', '网络异常，消息未发送');
    } finally {
      messageForm.classList.remove('pending');
      messageInput.focus();
    }
  });

  window.addEventListener('focus', () => {
    if (!eventSource || eventSource.readyState === EventSource.CLOSED) {
      connect();
    }
  });

  ensureUsername();
  setUsername(username);
  connect();
})();
