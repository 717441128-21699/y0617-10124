
import { addDays, format, subDays } from 'date-fns';
import type {
  Alert, DailyMetric, DashboardKpi, ExpiringGroup, Group, HighValueMember, Keyword, Member, MemberTag,
  MessageTemplate, ScheduleTask, DailyPoint, StrategyCompareResult, LifecyclePhase
} from '@/types';
import {
  GROUP_TYPE_LABELS, LIFECYCLE_LABELS, TAG_CATEGORY_LABELS, TEMPLATE_CATEGORY_LABELS,
  KEYWORD_GROUP_LABELS, CHART_COLORS,
} from '@/utils/constants';

const ID = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min: number, max: number, digits = 2) => Number((Math.random() * (max - min) + min).toFixed(digits));

const GROUP_NAMES = [
  '618新客福利群A', '618新客福利群B', '会员专属VIP1群', '会员专属VIP2群',
  '7日体验1群', '7日体验2群', '高端会员钻石群', '老客户回馈群',
  '新品预热群', '品牌会员官方群', '双11冲刺群', '护肤达人交流群',
  '母婴宝妈交流群', '数码爱好者群', '健身减脂打卡群', '读书会会员群',
];
const GROUP_TYPES: Group['type'][] = ['new_customer', 'paid_member', 'trial', 'vip'];
const LIFECYCLES: LifecyclePhase[] = ['preparation', 'active', 'declining', 'archived'];
const NICKNAMES = [
  '小明同学', '云朵朵', '追光者', '城南花已开', '柠檬不萌', '温如言',
  '月半小夜曲', '清风徐来', '旧时光', '半夏微凉', '诗与远方', '北岛情书',
  '糖糖妈', '果果爸', '王小美', '李大壮', '张老师', '陈医生',
  '爱购物的猫', '夜空中最亮', '樱花树下', '暖阳微醺', '咖啡不加糖',
];
const TAG_NAMES_ATTR = ['新用户', '注册7天内', '注册30天+', '活跃用户', '沉默用户', '一线城市', '女性', '男性', 'Z世代', '宝妈'];
const TAG_NAMES_BEHAVIOR = ['高互动', '低互动', '经常发言', '只看不发', '分享达人', '已购买', '复购用户', '爱提问', '参与活动', '领券达人'];
const TAG_NAMES_CONSUMPTION = ['高价值客户', '大客户', '中等消费', '低消费', '首单用户', '连续3月消费', '客单价>500', '会员等级-V1', '会员等级-V2', '会员等级-V3'];
const TAG_COLORS = ['#0D9488', '#2A6FF5', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#F97316', '#10B981', '#8B5CF6', '#EC4899'];
const OWNERS = ['运营-李娜', '运营-王强', '运营主管-赵敏', '社群-刘洋'];

function buildGroups(): Group[] {
  return GROUP_NAMES.map((name, i) => {
    const type = pick(GROUP_TYPES);
    const lifecycle = pick(LIFECYCLES);
    const memberCount = rand(150, 480);
    const createdAt = format(subDays(new Date(), rand(10, 180)), 'yyyy-MM-dd');
    const expireAt = format(addDays(new Date(), lifecycle === 'archived' ? -rand(5, 30) : rand(-10, 90)), 'yyyy-MM-dd');
    const daysLeft = Math.floor((new Date(expireAt).getTime() - Date.now()) / 86400000);
    let status: Group['status'] = 'normal';
    if (lifecycle === 'archived') status = 'archived';
    else if (daysLeft <= 3) status = 'expiring';
    else if (daysLeft <= 14) status = 'warning';
    return {
      id: ID('g'), name, avatar: '', type, typeLabel: GROUP_TYPE_LABELS[type],
      lifecycle, lifecycleLabel: LIFECYCLE_LABELS[lifecycle],
      memberCount, activeMembers7d: Math.floor(memberCount * randFloat(0.25, 0.75)),
      messageCountToday: rand(20, 500), createdAt, expireAt, status,
      owner: pick(OWNERS), description: `${name}，主要用于${GROUP_TYPE_LABELS[type]}运营管理。`,
      tags: [pick(['热门', '推荐', '高转化', '待维护', '重点群'])],
    };
  });
}

function buildTags(): MemberTag[] {
  const all: MemberTag[] = [];
  const build = (list: string[], cat: 'attribute' | 'behavior' | 'consumption') => list.forEach((n, i) => {
    const hasRule = Math.random() > 0.4;
    all.push({
      id: ID('t'), name: n, color: TAG_COLORS[i % TAG_COLORS.length],
      category: cat, categoryLabel: TAG_CATEGORY_LABELS[cat],
      memberCount: rand(200, 8000),
      autoRule: hasRule ? {
        field: pick(['join_days', 'consumption_total', 'message_count', 'last_active_days'] as const),
        operator: pick(['>', '<', '>=', '<='] as const),
        value: rand(10, 500),
      } : undefined,
    });
  });
  build(TAG_NAMES_ATTR, 'attribute');
  build(TAG_NAMES_BEHAVIOR, 'behavior');
  build(TAG_NAMES_CONSUMPTION, 'consumption');
  return all;
}

function buildMembers(groups: Group[], tags: MemberTag[]): Member[] {
  const list: Member[] = [];
  groups.forEach((g) => {
    const n = Math.min(g.memberCount, rand(30, 60));
    for (let i = 0; i < n; i++) {
      const joinDays = rand(1, 150);
      const consumption = rand(0, 20000);
      const mc = rand(0, 200);
      const score = Math.floor(consumption / 200 + mc * 2 + rand(0, 50));
      const pickedTags = tags.sort(() => Math.random() - 0.5).slice(0, rand(2, 5)).map(t => t.id);
      list.push({
        id: ID('m'), groupId: g.id, groupName: g.name,
        nickname: pick(NICKNAMES) + rand(10, 99), avatar: '',
        joinAt: format(subDays(new Date(), joinDays), 'yyyy-MM-dd'),
        lastActiveAt: format(subDays(new Date(), rand(0, 15)), 'yyyy-MM-dd HH:mm'),
        messageCount: mc, consumptionTotal: consumption, interactionScore: Math.floor(mc * 1.5),
        valueScore: score, tags: pickedTags,
        status: pick<'active' | 'inactive' | 'left'>(['active', 'active', 'active', 'inactive', 'left']),
      });
    }
  });
  return list;
}

function buildTemplates(): MessageTemplate[] {
  const cats: MessageTemplate['category'][] = ['welcome', 'weekly_report', 'promotion', 'after_sale', 'notice', 'custom'];
  const list: { title: string; category: MessageTemplate['category']; content: string; vars: string[] }[] = [
    { title: '新人入群欢迎语', category: 'welcome', vars: ['昵称', '群名称', '链接'], content: 'Hi，{{昵称}}！欢迎加入「{{群名称}}」🎉\n点击链接领取新人福利：{{链接}}' },
    { title: '周一早间问候', category: 'welcome', vars: ['昵称'], content: '早安 {{昵称}}！美好的一周从今天开始 ☀️' },
    { title: '每周运营数据报告', category: 'weekly_report', vars: ['周数', '新增成员', '消息总数', '活跃率'], content: '📊 第{{周数}}周运营报告\n新增成员：{{新增成员}}人\n消息总数：{{消息总数}}条\n活跃率：{{活跃率}}' },
    { title: '618大促活动通知', category: 'promotion', vars: ['折扣', '截止时间'], content: '🔥 618年中大促！全场{{折扣}}，{{截止时间}}截止，手慢无！' },
    { title: '会员专属福利', category: 'promotion', vars: ['会员等级', '优惠券金额'], content: '💎 {{会员等级}}会员专享：满500减{{优惠券金额}}优惠券已发放！' },
    { title: '售后问题处理', category: 'after_sale', vars: ['订单号', '处理进度'], content: '您好，您的订单（{{订单号}}）售后正在处理中，当前进度：{{处理进度}}' },
    { title: '发货通知', category: 'after_sale', vars: ['订单号', '快递单号'], content: '📦 您的订单{{订单号}}已发货，快递单号：{{快递单号}}，请注意查收！' },
    { title: '系统维护通知', category: 'notice', vars: ['维护时间'], content: '⚠️ 系统将于{{维护时间}}进行例行维护，届时可能无法正常使用。' },
    { title: '活动邀请', category: 'custom', vars: ['活动名称', '参与链接'], content: '诚邀您参加「{{活动名称}}」，点击报名：{{参与链接}}' },
  ];
  return list.map((x) => ({
    id: ID('tmp'), title: x.title, category: x.category, categoryLabel: TEMPLATE_CATEGORY_LABELS[x.category],
    content: x.content, variables: x.vars, usageCount: rand(5, 320),
    lastUsedAt: format(subDays(new Date(), rand(0, 30)), 'yyyy-MM-dd'),
    createdAt: format(subDays(new Date(), rand(30, 180)), 'yyyy-MM-dd'),
    createdBy: pick(OWNERS),
  }));
}

function buildTasks(templates: MessageTemplate[], groups: Group[]): ScheduleTask[] {
  const descs = [
    { cron: '0 9 * * 1', text: '每周一上午9:00' },
    { cron: '0 18 * * *', text: '每天下午18:00' },
    { cron: '0 10,15,20 * * *', text: '每天10/15/20点' },
    { cron: '0 0 1 * *', text: '每月1号凌晨' },
    { cron: '30 8 * * 1,3,5', text: '每周一三五早8:30' },
    { cron: '0 12 * * 6,0', text: '周末中午12点' },
  ];
  const names = ['周一早报推送', '晚间秒杀提醒', '午间问候', '月度会员账单', '专属活动通知', '周末福利推送'];
  return names.map((n, i) => {
    const t = pick(templates);
    const targetGroups = groups.sort(() => Math.random() - 0.5).slice(0, rand(1, 4));
    const d = descs[i];
    const statuses: ScheduleTask['status'][] = ['pending', 'running', 'paused', 'completed'];
    const next = addDays(new Date(), rand(0, 3));
    next.setHours(rand(8, 22), 0, 0, 0);
    return {
      id: ID('task'), name: n, templateId: t.id, templateTitle: t.title,
      cronExpression: d.cron, cronDescription: d.text,
      targetGroupIds: targetGroups.map(g => g.id),
      targetGroupNames: targetGroups.map(g => g.name),
      status: pick(statuses),
      nextRunAt: format(next, 'yyyy-MM-dd HH:mm:ss'),
      lastRunAt: format(subDays(new Date(), rand(1, 7)), 'yyyy-MM-dd HH:mm:ss'),
      lastRunResult: pick<'success' | 'failed'>(['success', 'success', 'success', 'failed']),
      totalSent: rand(200, 8000),
      createdAt: format(subDays(new Date(), rand(10, 90)), 'yyyy-MM-dd'),
    };
  });
}

function buildKeywords(): Keyword[] {
  const words: { word: string; group: Keyword['groupType']; priority: Alert['priority'] }[] = [
    { word: '投诉', group: 'complaint', priority: 'critical' },
    { word: '12315', group: 'complaint', priority: 'critical' },
    { word: '虚假宣传', group: 'complaint', priority: 'high' },
    { word: '欺骗', group: 'complaint', priority: 'high' },
    { word: '退款', group: 'refund', priority: 'high' },
    { word: '退货', group: 'refund', priority: 'medium' },
    { word: '我不要了', group: 'refund', priority: 'medium' },
    { word: '申请退款', group: 'refund', priority: 'high' },
    { word: '多少钱', group: 'purchase', priority: 'low' },
    { word: '怎么买', group: 'purchase', priority: 'low' },
    { word: '有没有优惠', group: 'purchase', priority: 'medium' },
    { word: '链接', group: 'purchase', priority: 'low' },
    { word: 'XX品牌', group: 'competitor', priority: 'medium' },
    { word: '别家更便宜', group: 'competitor', priority: 'medium' },
    { word: '政治敏感词', group: 'sensitive', priority: 'critical' },
    { word: '广告推广', group: 'custom', priority: 'low' },
  ];
  return words.map((x) => ({
    id: ID('kw'), word: x.word, groupType: x.group, groupLabel: KEYWORD_GROUP_LABELS[x.group],
    matchType: pick<'exact' | 'contains' | 'regex'>(['contains', 'contains', 'exact']),
    priority: x.priority, enabled: true, triggerCount: rand(3, 260),
  }));
}

function buildAlerts(groups: Group[], keywords: Keyword[], members: Member[]): Alert[] {
  const list: Alert[] = [];
  const statuses: Alert['status'][] = ['pending', 'pending', 'processing', 'resolved', 'ignored'];
  for (let i = 0; i < 18; i++) {
    const kw = pick(keywords);
    const member = pick(members);
    const group = groups.find(g => g.id === member.groupId) || pick(groups);
    const time = subDays(new Date(), rand(0, 3));
    time.setHours(rand(8, 22), rand(0, 59), 0, 0);
    const ctxTexts = [
      '大家好，新来的报个到~',
      '问下这个产品怎么用呀？',
      `这个问题我也遇到了，${kw.word}怎么解决？`,
      '客服在吗？麻烦回复一下',
      '收到，谢谢！',
    ];
    list.push({
      id: ID('a'), keywordId: kw.id, keyword: kw.word, priority: kw.priority,
      memberId: member.id, memberName: member.nickname, memberAvatar: '',
      groupId: group.id, groupName: group.name,
      messageId: ID('msg'),
      messageContent: pick([`${kw.word}！太让人生气了，这怎么处理？`, `想问下${kw.word}的流程是什么？`, `有没有人遇到过${kw.word}的情况？`, `强烈${kw.word}，不处理我就投诉到底！`]),
      messageTime: format(time, 'yyyy-MM-dd HH:mm:ss'),
      contextMessages: ctxTexts.map((c, idx) => ({
        id: ID('ctx'), sender: idx === 2 ? member.nickname : pick(NICKNAMES),
        isSelf: idx === 4, content: c,
        time: format(addDays(time, 0), 'HH:mm'),
      })),
      status: pick(statuses),
      note: Math.random() > 0.5 ? '已私信用户，正在跟进处理中。' : undefined,
      handledBy: Math.random() > 0.4 ? pick(OWNERS) : undefined,
      handledAt: format(subDays(time, -rand(0, 1)), 'yyyy-MM-dd HH:mm:ss'),
      createdAt: format(time, 'yyyy-MM-dd HH:mm:ss'),
    });
  }
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function buildDailyMetrics(days = 14): DailyMetric[] {
  const result: DailyMetric[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = subDays(new Date(), i);
    result.push({
      date: format(d, 'MM-dd'),
      groupCount: 120 + (days - i) * 2,
      memberCount: 35000 + (days - i) * 120 + rand(-50, 200),
      messageCount: rand(12000, 28000),
      activeMembers: rand(15000, 24000),
      newMembers: rand(300, 900),
      leftMembers: rand(50, 180),
    });
  }
  return result;
}

function buildKpi(metrics: DailyMetric[], pendingAlerts: number): DashboardKpi {
  const today = metrics[metrics.length - 1];
  const prev = metrics[metrics.length - 2];
  return {
    totalGroups: today.groupCount,
    totalMembers: today.memberCount,
    todayMessages: today.messageCount,
    activeRate: today.activeMembers / today.memberCount,
    churnRate: today.leftMembers / today.memberCount,
    pendingAlerts,
    delta: {
      totalGroups: ((today.groupCount - prev.groupCount) / prev.groupCount) * 100,
      totalMembers: ((today.memberCount - prev.memberCount) / prev.memberCount) * 100,
      todayMessages: ((today.messageCount - prev.messageCount) / prev.messageCount) * 100,
      activeRate: (today.activeMembers / today.memberCount - prev.activeMembers / prev.memberCount) * 100,
      churnRate: (today.leftMembers / today.memberCount - prev.leftMembers / prev.memberCount) * 100,
      pendingAlerts: 0,
    },
  };
}

function buildDailyPoint(points: { date: string; value: number }[]): DailyPoint[] {
  return points.map((p) => ({ date: p.date, value: p.value }));
}

function buildExpiringGroups(groups: Group[]): ExpiringGroup[] {
  return groups
    .filter((g) => g.lifecycle !== 'archived')
    .map((g) => {
      const daysLeft = Math.floor((new Date(g.expireAt).getTime() - Date.now()) / 86400000);
      if (daysLeft > 14) return null;
      const hv = Math.floor(g.memberCount * 0.08);
      return {
        id: g.id, name: g.name, type: g.type, typeLabel: g.typeLabel, lifecycle: g.lifecycle,
        expireAt: g.expireAt, daysLeft, memberCount: g.memberCount, highValueCount: hv,
        suggestedAction: daysLeft <= 0 ? 'archive' : hv > 20 ? 'migrate' : 'extend',
      } as ExpiringGroup;
    })
    .filter((x): x is ExpiringGroup => x !== null)
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

function buildHighValueMembers(members: Member[]): HighValueMember[] {
  return [...members]
    .sort((a, b) => b.valueScore - a.valueScore)
    .slice(0, 12)
    .map((m) => ({
      id: m.id, nickname: m.nickname, avatar: m.avatar,
      groupId: m.groupId, groupName: m.groupName,
      valueScore: m.valueScore, consumptionTotal: m.consumptionTotal,
      interactionScore: m.interactionScore, lastActiveAt: m.lastActiveAt, tags: m.tags,
    }));
}

function buildCompareResult(groups: Group[]): StrategyCompareResult {
  const target = groups.filter((g) => g.lifecycle !== 'archived').slice(0, 3);
  const dates: string[] = [];
  const trends: StrategyCompareResult['trends'] = [];
  for (let i = 6; i >= 0; i--) {
    const d = format(subDays(new Date(), i), 'MM-dd');
    dates.push(d);
    const values: Record<string, number> = {};
    target.forEach((g) => { values[g.id] = rand(40, 85); });
    trends.push({ date: d, values });
  }
  return {
    groups: target.map((g, i) => ({ id: g.id, name: g.name, color: CHART_COLORS[i] })),
    metrics: [
      { key: 'active_rate', label: '活跃率(%)', values: target.map(() => rand(45, 85)) },
      { key: 'msg_count', label: '消息量', values: target.map(() => rand(800, 3500)) },
      { key: 'churn_rate', label: '流失率(%)', values: target.map(() => randFloat(0.5, 3.2)) },
      { key: 'new_member', label: '新增人数', values: target.map(() => rand(20, 120)) },
    ],
    trends,
    insights: [
      `「${target[0]?.name || '群A'}」的活跃率持续领先，建议分析其运营策略并在其他群推广。`,
      `对比发现，周末消息量普遍下降${rand(10, 25)}%，可考虑在周末增加互动活动。`,
      `高价值成员集中在付费会员群，VIP群的客单价高于普通群${rand(40, 120)}%。`,
    ],
  };
}

export function buildMockStore() {
  const groups = buildGroups();
  const tags = buildTags();
  const members = buildMembers(groups, tags);
  const templates = buildTemplates();
  const tasks = buildTasks(templates, groups);
  const keywords = buildKeywords();
  const alerts = buildAlerts(groups, keywords, members);
  const dailyMetrics = buildDailyMetrics(14);
  const pendingAlerts = alerts.filter((a) => a.status === 'pending').length;
  const kpi = buildKpi(dailyMetrics, pendingAlerts);
  const messageTrend = buildDailyPoint(dailyMetrics.map((d) => ({ date: d.date, value: d.messageCount })));
  const activeTrend = buildDailyPoint(dailyMetrics.map((d) => ({ date: d.date, value: Math.round((d.activeMembers / d.memberCount) * 1000) / 10 })));
  const memberGrowthTrend = buildDailyPoint(dailyMetrics.map((d) => ({ date: d.date, value: d.memberCount })));
  const expiringGroups = buildExpiringGroups(groups);
  const highValueMembers = buildHighValueMembers(members);
  const compareResult = buildCompareResult(groups);

  return {
    groups, tags, members, templates, tasks, keywords, alerts,
    dailyMetrics, kpi, messageTrend, activeTrend, memberGrowthTrend,
    expiringGroups, highValueMembers, compareResult,
  };
}

export type MockStore = ReturnType<typeof buildMockStore>;
