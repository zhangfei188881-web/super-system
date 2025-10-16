const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const MAX_BODY_SIZE = 1e6; // 1MB

const homeData = {
  hero: {
    brand: '云速达 · 微校园',
    slogan: '一站式校园生活服务，用心守护每一个紧急时刻',
    stats: {
      completedOrdersToday: 126,
      averageDeliveryMinutes: 18,
      serviceSatisfaction: 98
    }
  },
  announcements: [
    {
      id: 'a1',
      title: '午高峰档口加开窗口',
      description: '食堂一楼今日 11:30-13:30 将增开 2 个取餐窗口，请大家按指引排队。',
      date: '05-18',
      level: 'info'
    },
    {
      id: 'a2',
      title: '图书馆打印优惠',
      description: '5 月学习季，持学生证前往智慧打印点可享黑白打印 8 折优惠。',
      date: '05-18',
      level: 'success'
    },
    {
      id: 'a3',
      title: '夜间跑腿温馨提示',
      description: '23:00 后下单请在备注中标明宿舍楼与寝室号，便于骑手快速送达。',
      date: '05-17',
      level: 'warning'
    }
  ],
  categories: [
    {
      id: 'canteen-market',
      name: '食堂超市',
      description: '热餐速递、零食饮料即时达',
      icon: '🍱',
      accent: 'linear-gradient(135deg,#ff9a9e,#fad0c4)'
    },
    {
      id: 'document-print',
      name: '文件打印',
      description: '云端上传 极速取件',
      icon: '🖨️',
      accent: 'linear-gradient(135deg,#a18cd1,#fbc2eb)'
    },
    {
      id: 'second-hand',
      name: '二手市场',
      description: '闲置书本 秒上新',
      icon: '📚',
      accent: 'linear-gradient(135deg,#f6d365,#fda085)'
    },
    {
      id: 'errand',
      name: '校园跑腿',
      description: '代购代取 一键发布',
      icon: '🏃‍♂️',
      accent: 'linear-gradient(135deg,#5ee7df,#b490ca)'
    },
    {
      id: 'express',
      name: '快递到寝',
      description: '免排队 专人送',
      icon: '📦',
      accent: 'linear-gradient(135deg,#cfd9df,#e2ebf0)'
    },
    {
      id: 'repair',
      name: '宿舍报修',
      description: '水电网络 及时修',
      icon: '🛠️',
      accent: 'linear-gradient(135deg,#d4fc79,#96e6a1)'
    },
    {
      id: 'study-room',
      name: '自习预约',
      description: '空余座位 实时看',
      icon: '🪑',
      accent: 'linear-gradient(135deg,#84fab0,#8fd3f4)'
    },
    {
      id: 'lost-found',
      name: '失物招领',
      description: '失而复得 校务号',
      icon: '🔍',
      accent: 'linear-gradient(135deg,#fccb90,#d57eeb)'
    }
  ],
  featuredFloors: [
    {
      id: 'floor-1',
      name: '食堂一楼',
      waiting: '平均出餐 6 分钟',
      distance: '距你 350 米',
      highlights: ['现煮粉面', '鲜榨果汁'],
      stalls: [
        {
          id: 'stall-11',
          name: '瓦香鸡米饭',
          price: '¥12.80 起',
          soldToday: 384,
          tags: ['下单立减 ¥2', '约 20 分钟送达']
        },
        {
          id: 'stall-12',
          name: '老长沙大香肠',
          price: '¥9.90 起',
          soldToday: 241,
          tags: ['新品热卖', '香辣/原味任选']
        },
        {
          id: 'stall-13',
          name: '鲜蔬手工饼',
          price: '¥8.50 起',
          soldToday: 198,
          tags: ['芝士加倍', '自提免排队']
        }
      ]
    },
    {
      id: 'floor-2',
      name: '食堂二楼',
      waiting: '平均出餐 8 分钟',
      distance: '距你 410 米',
      highlights: ['精品小炒', '盖码饭'],
      stalls: [
        {
          id: 'stall-21',
          name: '川香小炒肉',
          price: '¥13.50 起',
          soldToday: 305,
          tags: ['下单返券', '双人套餐减 ¥5']
        },
        {
          id: 'stall-22',
          name: '汤鲜砂锅面',
          price: '¥11.20 起',
          soldToday: 276,
          tags: ['可选微辣', '可预约取餐']
        },
        {
          id: 'stall-23',
          name: '锡纸花甲粉',
          price: '¥12.00 起',
          soldToday: 223,
          tags: ['夜宵限定', '加料不加价']
        }
      ]
    }
  ],
  onDemandServices: [
    {
      id: 'print-fast',
      name: '云打印·智取柜',
      icon: '🖨️',
      eta: '最快 15 分钟',
      price: '¥0.8/页 起',
      description: '支持 PDF/图片在线上传，短信通知到柜取件。'
    },
    {
      id: 'package-delivery',
      name: '快递到寝',
      icon: '🚲',
      eta: '平均 25 分钟',
      price: '¥3 起/件',
      description: '小哥代排队领取快递，支持送到寝室门口。'
    },
    {
      id: 'supermarket',
      name: '超市急送',
      icon: '🛒',
      eta: '约 18 分钟',
      price: '商品实价+跑腿费',
      description: '夜宵零食、生活用品即刻下单即刻配送。'
    },
    {
      id: 'document-run',
      name: '教务跑腿',
      icon: '📄',
      eta: '工作时间专人处理',
      price: '¥12 起',
      description: '代办成绩单、盖章、缴费，实时同步进度。'
    }
  ],
  contact: {
    hotline: '400-889-7755',
    wechat: 'yunxiaoyuan-service',
    email: 'support@yunxiaoyuan.cn',
    serviceHours: '周一至周日 07:30 - 23:30',
    location: '校园综合服务中心 1 层 服务台',
    notice: '提交表单后，客服将在 10 分钟内与您取得联系。'
  }
};

const contactRequests = [];

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.js':
      return 'application/javascript; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.svg':
      return 'image/svg+xml';
    case '.png':
      return 'image/png';
    case '.ico':
      return 'image/x-icon';
    default:
      return 'application/octet-stream';
  }
}

function sendJSON(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(payload));
}

function sanitize(value, { maxLength = 200 } = {}) {
  if (value === undefined || value === null) {
    return '';
  }
  return String(value).trim().slice(0, maxLength);
}

function handleApi(req, res, parsedUrl) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return true;
  }

  if (req.method === 'GET' && parsedUrl.pathname === '/api/home') {
    const payload = {
      ...homeData,
      serverTime: new Date().toISOString(),
      pendingContactCount: contactRequests.length
    };
    sendJSON(res, 200, payload);
    return true;
  }

  if (req.method === 'POST' && parsedUrl.pathname === '/api/contact') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > MAX_BODY_SIZE) {
        body = '';
        res.writeHead(413, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: '请求体过大' }));
        req.connection.destroy();
      }
    });

    req.on('end', () => {
      if (!body) {
        sendJSON(res, 400, { error: '请求体不能为空' });
        return;
      }

      try {
        const parsed = JSON.parse(body);
        const name = sanitize(parsed.name, { maxLength: 32 });
        const phone = sanitize(parsed.phone, { maxLength: 20 });
        const serviceType = sanitize(parsed.serviceType, { maxLength: 50 });
        const message = sanitize(parsed.message, { maxLength: 500 });

        if (!name) {
          sendJSON(res, 400, { error: '请填写您的姓名或昵称' });
          return;
        }
        if (!message) {
          sendJSON(res, 400, { error: '请填写您需要帮助的内容' });
          return;
        }
        if (phone && !/^\+?[0-9\-\s]{5,20}$/.test(phone)) {
          sendJSON(res, 400, { error: '联系方式格式不正确，请留下常用手机号或短号' });
          return;
        }

        const ticket = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        contactRequests.push({
          ticket,
          name,
          phone,
          serviceType,
          message,
          createdAt: new Date().toISOString()
        });

        sendJSON(res, 201, {
          status: 'ok',
          ticket,
          message: '已收到您的咨询，客服将在 10 分钟内联系您。'
        });
      } catch (error) {
        sendJSON(res, 400, { error: '无法解析请求，请检查提交内容' });
      }
    });

    return true;
  }

  return false;
}

function serveStatic(req, res) {
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;
  if (!pathname || pathname === '/') {
    pathname = '/index.html';
  }

  const filePath = path.join(PUBLIC_DIR, pathname);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    res.writeHead(200, { 'Content-Type': getContentType(filePath) });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);

  if (parsedUrl.pathname && parsedUrl.pathname.startsWith('/api/')) {
    const handled = handleApi(req, res, parsedUrl);
    if (handled) {
      return;
    }
    sendJSON(res, 404, { error: '接口未找到' });
    return;
  }

  if (req.method === 'GET' && parsedUrl.pathname === '/health') {
    sendJSON(res, 200, {
      status: 'ok',
      uptime: process.uptime(),
      pendingContactCount: contactRequests.length
    });
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`Campus service portal is running at http://localhost:${PORT}`);
});
