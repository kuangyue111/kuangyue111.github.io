import { readFileSync, writeFileSync } from 'node:fs';

const root = 'D:/vagrant/work_share/AI/Electra200ms-ppt/';
const htmlPath = root + 'index.html';
const slidesPath = root + 'slides.html';
let html = readFileSync(htmlPath, 'utf8');
const slides = readFileSync(slidesPath, 'utf8').trim();

// 1) title
html = html.replace(
  '<title>[必填] 替换为 PPT 标题 · Deck Title</title>',
  '<title>200ms 电网调频 · Solaris 储能系统</title>'
);

// 2) 注入 7 页幻灯片（替换模板示例区）
const si = html.indexOf('<!-- ============ 示例:第 1 页');
const ei = html.indexOf('<div id="nav"></div>');
if (si < 0 || ei < 0) throw new Error('slide markers not found: ' + si + ' ' + ei);
// ei 处是 deck 容器的关闭 </div> 之后、nav 之前；回退到 deck 的 </div> 之前
const deckClose = html.lastIndexOf('</div>', ei);
html = html.slice(0, si) + slides + '\r\n' + html.slice(deckClose);

// 3) 演讲备注
const notesBlock = `const SPEAKER_NOTES = [
  {
    id: 'cover', title: '200ms 电网调频', section: '开场', minutes: 0.6,
    purpose: '抛出 200ms 这个硬约束，建立储能调频的现场预期',
    talk: ['储能参与电网调频，核心指标是有功功率响应 ≤200ms', '原有链路要走 500ms~1s，差距来自多级中转', '这次要做的，是在不破坏原架构的前提下开辟一条快速通道'],
    transition: '先看为什么 200ms 是硬约束', cue: '确认观众屏同步'
  },
  {
    id: 'problem', title: '为什么需要 200ms', section: '背景', minutes: 1.5,
    purpose: '把 500ms~1s 的原链路与 200ms 要求摆在一起，说明改造必要性',
    talk: ['电网频率 50Hz ±0.2Hz，频率偏离意味着有功失衡', '储能的毫秒级响应是它对火电调频的核心竞争力', '原链路慢在两个地方：多级中转 + select 非阻塞调度延迟'],
    transition: '先梳理系统架构，搞清楚数据流再动手', cue: ''
  },
  {
    id: 'architecture', title: '三层控制链路', section: '架构', minutes: 1.5,
    purpose: '建立上级调度 / 主站决策 / 从站执行三层心智模型',
    talk: ['上层 EMS 经 Modbus TCP 下发功率指令', 'CCU 主站跑 EMS 算法，是决策核心', '从站把指令落成对 PCS / BMS 的实际控制', '信号量是层与层之间的轻量触发机制'],
    transition: '架构清楚了，进入六个核心设计决策', cue: ''
  },
  {
    id: 'design', title: '不破坏原架构的快速通道', section: '核心设计', minutes: 2.0,
    purpose: '用六个决策讲清快速通道如何在不破坏原架构的前提下成立',
    talk: ['独立通道：GridSvc 与 QickAnt 语义隔离', '阻塞模式：用确定性延迟换吞吐', '二值信号量：只要最新指令，不堆积', 'SCHED_RR + 优先级 98：保证实时调度', 'EXPLICIT_SCHED 不能省，否则优先级失效', '参数化开关：一套固件多项目复用'],
    transition: '设计落地后，看一条指令的真实旅程和延迟账单', cue: ''
  },
  {
    id: 'latency', title: '一条指令的时间账单', section: '延迟', minutes: 1.5,
    purpose: '用 ~91ms 的账单证明设计远低于 200ms 上限',
    talk: ['PCS 的 50ms 是最大头，属物理响应，无法再压', 'EMS 计算 20ms 是第二大头', 'UDP 直传只有 1ms，无握手是它快的原因', '合计 91ms，留给裕量充足'],
    transition: '再把这六步串成一条完整链路', cue: ''
  },
  {
    id: 'journey', title: '从 EMS 到 PCS 的六步', section: '数据流', minutes: 1.5,
    purpose: '把六个环节串成一条端到端的实时链路',
    talk: ['第一步 EMS 写 3901 寄存器，是旅程起点', 'Modbus 阻塞线程立即唤醒解析', 'CCU 被二值信号量触发，跑 EMS 决策', 'UDP 9990 直传，无握手开销', '从站接收后经信号量通知 CCU 执行', '最后 PCS 调整输出功率，完成闭环'],
    transition: '回到整体，把收获收束成三点', cue: ''
  },
  {
    id: 'closing', title: '200ms 背后的系统工程', section: '收束', minutes: 1.0,
    purpose: '把实时性 / 可靠性 / 可维护性三条 takeaway 说成一个完整判断',
    talk: ['实时性来自调度、阻塞、二值信号量三层协同', '可靠性来自独立通道的语义隔离', '可维护性来自参数化开关与模块化重构', '200ms 只是结果，真正的功课在系统层面'],
    transition: '结束演讲，进入提问', cue: '停顿 2 秒后致谢'
  }
];`;
html = html.replace(
  /const SPEAKER_NOTES = \[[\s\S]*?\];\nwindow\.__SPEAKER_NOTES__/,
  notesBlock + '\nwindow.__SPEAKER_NOTES__'
);

writeFileSync(htmlPath, html);
console.log('done: slides injected, title + notes replaced.');
