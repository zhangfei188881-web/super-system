(() => {
  const announcementList = document.getElementById('announcement-list');
  const serviceGrid = document.getElementById('service-grid');
  const floorTabs = document.getElementById('floor-tabs');
  const floorContent = document.getElementById('floor-content');
  const ondemandGrid = document.getElementById('ondemand-grid');
  const supportInfo = document.getElementById('support-info');
  const supportNotice = document.getElementById('support-notice');
  const supportButton = document.getElementById('support-button');
  const contactButton = document.getElementById('contact-button');
  const contactFab = document.getElementById('contact-fab');
  const contactDialog = document.getElementById('contact-dialog');
  const contactForm = document.getElementById('contact-form');
  const contactCancel = document.getElementById('contact-cancel');
  const contactHint = document.getElementById('contact-hint');
  const contactSubmit = document.getElementById('contact-submit');
  const toast = document.getElementById('toast');
  const searchInput = document.getElementById('global-search');
  const footerYear = document.getElementById('footer-year');
  const heroBrand = document.getElementById('hero-brand');
  const heroSlogan = document.getElementById('hero-slogan');
  const statOrders = document.getElementById('stat-orders');
  const statDelivery = document.getElementById('stat-delivery');
  const statSatisfaction = document.getElementById('stat-satisfaction');

  let dashboardData = null;
  let activeFloorId = null;
  let servicesCache = [];
  let ondemandCache = [];
  let toastTimer = null;

  function setFooterYear() {
    if (footerYear) {
      footerYear.textContent = new Date().getFullYear();
    }
  }

  function showToast(message, type = 'info') {
    if (!toast) return;
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.dataset.type = type;
    toast.hidden = false;
    toast.classList.add('show');
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
      toastTimer = setTimeout(() => {
        toast.hidden = true;
      }, 220);
    }, 3800);
  }

  function escapeHtml(input) {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderAnnouncements(list = []) {
    if (!announcementList) return;
    if (!list.length) {
      announcementList.innerHTML = '<p class="empty">暂无公告</p>';
      return;
    }

    const fragment = document.createDocumentFragment();
    list.forEach(item => {
      const card = document.createElement('article');
      card.className = `announcement-card announcement-${item.level || 'info'}`;
      card.innerHTML = `
        <header>
          <span class="announcement-date">${escapeHtml(item.date || '')}</span>
          <h3>${escapeHtml(item.title || '')}</h3>
        </header>
        <p>${escapeHtml(item.description || '')}</p>
      `;
      fragment.appendChild(card);
    });
    announcementList.innerHTML = '';
    announcementList.appendChild(fragment);
  }

  function createServiceCard(item) {
    const card = document.createElement('article');
    card.className = 'service-card';
    card.style.setProperty('--accent', item.accent || 'linear-gradient(135deg,#84fab0,#8fd3f4)');
    card.innerHTML = `
      <span class="service-icon" aria-hidden="true">${escapeHtml(item.icon || '📦')}</span>
      <div>
        <h3>${escapeHtml(item.name || '')}</h3>
        <p>${escapeHtml(item.description || '')}</p>
      </div>
      <button type="button" class="service-action" aria-label="立即前往${escapeHtml(item.name || '')}">
        进入
      </button>
    `;
    return card;
  }

  function renderServices(list = []) {
    if (!serviceGrid) return;
    if (!list.length) {
      serviceGrid.innerHTML = '<p class="empty">暂无匹配的服务，换个关键词试试。</p>';
      return;
    }
    const fragment = document.createDocumentFragment();
    list.forEach(item => fragment.appendChild(createServiceCard(item)));
    serviceGrid.innerHTML = '';
    serviceGrid.appendChild(fragment);
  }

  function renderFloorTabs(floors = []) {
    if (!floorTabs) return;
    const fragment = document.createDocumentFragment();
    floors.forEach((floor, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'floor-tab';
      button.textContent = floor.name;
      button.dataset.floorId = floor.id;
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
      button.addEventListener('click', () => setActiveFloor(floor.id));
      fragment.appendChild(button);
    });
    floorTabs.innerHTML = '';
    floorTabs.appendChild(fragment);
    if (floors.length) {
      setActiveFloor(floors[0].id);
    }
  }

  function createStallCard(stall) {
    const card = document.createElement('article');
    card.className = 'stall-card';
    const tagList = (stall.tags || []).map(tag => `<span>${escapeHtml(tag)}</span>`).join('');
    card.innerHTML = `
      <div class="stall-title">
        <h3>${escapeHtml(stall.name || '')}</h3>
        <span class="stall-price">${escapeHtml(stall.price || '')}</span>
      </div>
      <p class="stall-meta">今日销量 <strong>${escapeHtml(String(stall.soldToday || 0))}</strong> 份</p>
      <div class="stall-tags">${tagList}</div>
      <button type="button" class="stall-action">立即下单</button>
    `;
    return card;
  }

  function setActiveFloor(floorId) {
    if (!dashboardData || !floorContent) return;
    if (activeFloorId === floorId) return;
    activeFloorId = floorId;
    const floors = dashboardData.featuredFloors || [];
    const current = floors.find(floor => floor.id === floorId);
    if (!current) return;

    const tabButtons = floorTabs?.querySelectorAll('.floor-tab');
    tabButtons?.forEach(btn => {
      const selected = btn.dataset.floorId === floorId;
      btn.classList.toggle('active', selected);
      btn.setAttribute('aria-selected', selected ? 'true' : 'false');
    });

    const fragment = document.createDocumentFragment();
    const infoCard = document.createElement('div');
    infoCard.className = 'floor-summary';
    infoCard.innerHTML = `
      <div>
        <h3>${escapeHtml(current.name || '')}</h3>
        <p>${escapeHtml(current.waiting || '')}</p>
      </div>
      <div>
        <p class="floor-distance">${escapeHtml(current.distance || '')}</p>
        <p class="floor-highlight">亮点：${escapeHtml((current.highlights || []).join('、'))}</p>
      </div>
    `;
    fragment.appendChild(infoCard);

    (current.stalls || []).forEach(stall => fragment.appendChild(createStallCard(stall)));
    if (!current.stalls || !current.stalls.length) {
      const empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = '该楼层暂未开放线上订餐';
      fragment.appendChild(empty);
    }
    floorContent.innerHTML = '';
    floorContent.appendChild(fragment);
  }

  function createOndemandCard(item) {
    const card = document.createElement('article');
    card.className = 'ondemand-card';
    card.innerHTML = `
      <div class="ondemand-icon" aria-hidden="true">${escapeHtml(item.icon || '🛵')}</div>
      <div class="ondemand-body">
        <div class="ondemand-title">
          <h3>${escapeHtml(item.name || '')}</h3>
          <span>${escapeHtml(item.price || '')}</span>
        </div>
        <p>${escapeHtml(item.description || '')}</p>
        <p class="ondemand-meta">预计：${escapeHtml(item.eta || '')}</p>
      </div>
      <button type="button" class="ondemand-action">立即预约</button>
    `;
    return card;
  }

  function renderOndemand(list = []) {
    if (!ondemandGrid) return;
    if (!list.length) {
      ondemandGrid.innerHTML = '<p class="empty">暂未找到相关跑腿服务。</p>';
      return;
    }
    const fragment = document.createDocumentFragment();
    list.forEach(item => fragment.appendChild(createOndemandCard(item)));
    ondemandGrid.innerHTML = '';
    ondemandGrid.appendChild(fragment);
  }

  function renderSupport(contact = {}) {
    if (!supportInfo) return;
    const { hotline, wechat, email, serviceHours, location, notice } = contact;
    supportNotice.textContent = notice || '提交后我们将尽快联系您。';
    contactHint.textContent = serviceHours ? `客服在线时间：${serviceHours}` : '';

    const supportItems = [
      { icon: '📞', label: '客服热线', value: hotline },
      { icon: '💬', label: '企业微信', value: wechat },
      { icon: '📧', label: '服务邮箱', value: email },
      { icon: '📍', label: '线下客服点', value: location }
    ].filter(item => item.value);

    const fragment = document.createDocumentFragment();
    supportItems.forEach(item => {
      const row = document.createElement('div');
      row.className = 'support-row';
      row.innerHTML = `
        <span class="support-icon" aria-hidden="true">${escapeHtml(item.icon)}</span>
        <div>
          <p class="support-label">${escapeHtml(item.label)}</p>
          <p class="support-value">${escapeHtml(item.value)}</p>
        </div>
      `;
      fragment.appendChild(row);
    });
    supportInfo.innerHTML = '';
    supportInfo.appendChild(fragment);
  }

  function filterDataByKeyword(keyword) {
    if (!keyword) {
      renderServices(servicesCache);
      renderOndemand(ondemandCache);
      return;
    }
    const lower = keyword.toLowerCase();
    const filteredServices = servicesCache.filter(item => {
      const text = `${item.name || ''} ${item.description || ''}`.toLowerCase();
      return text.includes(lower);
    });
    const filteredOndemand = ondemandCache.filter(item => {
      const text = `${item.name || ''} ${item.description || ''} ${item.eta || ''}`.toLowerCase();
      return text.includes(lower);
    });
    renderServices(filteredServices);
    renderOndemand(filteredOndemand);
  }

  function openContactDialog() {
    if (!contactDialog) return;
    if (typeof contactDialog.showModal === 'function') {
      contactDialog.showModal();
    } else {
      contactDialog.setAttribute('open', '');
    }
    requestAnimationFrame(() => {
      document.getElementById('contact-name')?.focus();
    });
  }

  function closeContactDialog() {
    if (!contactDialog) return;
    if (typeof contactDialog.close === 'function') {
      contactDialog.close();
    } else {
      contactDialog.removeAttribute('open');
    }
  }

  async function submitContactForm(event) {
    event.preventDefault();
    if (!contactForm) return;
    const formData = new FormData(contactForm);
    const payload = Object.fromEntries(formData.entries());
    contactSubmit.disabled = true;
    contactSubmit.textContent = '提交中...';

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || '提交失败，请稍后再试');
      }

      showToast(result.message || '客服已收到您的消息，我们会尽快回复。', 'success');
      closeContactDialog();
      contactForm.reset();
    } catch (error) {
      showToast(error.message || '网络异常，请稍后再试', 'error');
    } finally {
      contactSubmit.disabled = false;
      contactSubmit.textContent = '提交咨询';
    }
  }

  async function loadDashboard() {
    try {
      const response = await fetch('/api/home');
      if (!response.ok) {
        throw new Error('无法获取校园服务数据');
      }
      dashboardData = await response.json();
      servicesCache = dashboardData.categories || [];
      ondemandCache = dashboardData.onDemandServices || [];

      if (heroBrand && dashboardData.hero?.brand) {
        heroBrand.textContent = dashboardData.hero.brand;
      }
      if (heroSlogan && dashboardData.hero?.slogan) {
        heroSlogan.textContent = dashboardData.hero.slogan;
      }
      if (statOrders) {
        const orders = dashboardData.hero?.stats?.completedOrdersToday;
        statOrders.textContent = orders ? `${orders} 单` : '—';
      }
      if (statDelivery) {
        const delivery = dashboardData.hero?.stats?.averageDeliveryMinutes;
        statDelivery.textContent = delivery ? `${delivery} 分钟` : '—';
      }
      if (statSatisfaction) {
        const satisfaction = dashboardData.hero?.stats?.serviceSatisfaction;
        statSatisfaction.textContent = satisfaction ? `${satisfaction}%` : '—';
      }

      renderAnnouncements(dashboardData.announcements);
      renderServices(servicesCache);
      renderFloorTabs(dashboardData.featuredFloors);
      renderOndemand(ondemandCache);
      renderSupport(dashboardData.contact);
    } catch (error) {
      console.error(error);
      showToast(error.message || '系统繁忙，请稍后再试', 'error');
      if (announcementList) {
        announcementList.innerHTML = '<p class="empty">暂时无法获取公告，请稍后刷新。</p>';
      }
    }
  }

  function bindEvents() {
    contactButton?.addEventListener('click', openContactDialog);
    contactFab?.addEventListener('click', openContactDialog);
    supportButton?.addEventListener('click', openContactDialog);
    contactCancel?.addEventListener('click', () => {
      contactForm?.reset();
      closeContactDialog();
    });
    contactForm?.addEventListener('submit', submitContactForm);
    contactDialog?.addEventListener('close', () => {
      contactForm?.reset();
      contactSubmit.disabled = false;
      contactSubmit.textContent = '提交咨询';
    });
    searchInput?.addEventListener('input', event => {
      const keyword = event.target.value.trim();
      filterDataByKeyword(keyword);
    });
  }

  window.addEventListener('DOMContentLoaded', () => {
    setFooterYear();
    bindEvents();
    loadDashboard();
  });
})();
