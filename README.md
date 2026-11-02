# 研知台 · Agent 知识探索

围绕“知识挖掘与探索”，向用户介绍 Agent、工具调用与相关前沿方向。把已有调研整理成可阅读的知识库和学习路径，结合带引用答疑与真实实验案例帮助理解。

benchmark 展示保留预先录制的工具调用回放：查看任务的工具发现、调用、返回和结果，支持播放/暂停及逐步查看；播放已有记录不调用模型、不执行工具，也不消耗生成额度。

- [需求文档](docs/需求文档.md)：产品范围、Notion Style、调用额度与验收。
- [资料与内容清单](docs/资料清单.md)：已有资料、学习内容和待补充信息。
- [模型与知识库方案](docs/知识库与模型接入方案.md)：DeepSeek、检索、引用和费用控制。

已实现 8 篇知识短文、3 条学习路径、分类与搜索、带引用答疑、实验结果详情及工具调用回放。当前回放为明确标注的教学演示；真实 benchmark 成绩和预录轨迹等待评测组提供，不用样例补造实测。

视觉采用 [Notion Style](https://www.stylekit.top/zh/styles/notion-style)。内容优先，通过布局、留白和排版表达层次，删除不必要的副标题、说明与装饰。

前端使用 React / TypeScript 与 Vinext，内容保存在 JSON，额度与缓存保存在 Cloudflare D1。生成服务使用 DeepSeek，密钥只放服务端。正式环境每位访客 100 次/日、3 次/分钟，全站预算上限 5 美元/日，输出上限 2000 tokens。本地可选择测试额度，浏览器不能切换配置。

## 本地运行

需要 Node.js 22.13+。安装后，将 `.env.example` 复制为 `.env.local`，填写自己的 `DEEPSEEK_API_KEY`，并为 `COOKIE_SECRET` 生成至少 24 字符的随机值；再将配置复制为 `.dev.vars`，供本地 Worker 读取。两份文件均被 Git 忽略，不互相发送密钥。

```powershell
npm run install:ci
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_watery_vermin.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_careless_xorn.sql
npm run dev -- --port 5173 --hostname 127.0.0.1
```

以上 SQL 只在新建本地库时按顺序执行一次。没有模型密钥时仍可阅读和播放回放；问答不会退化成无限制调用。仅本机测试时可在 `.dev.vars` 设置 `APP_ENV=testing`，额度提高到 1000 次/日、20 次/分钟，费用上限仍为 5 美元。

`npm test` 检查额度、竞态、引用、检索与实验导入，`npm run typecheck` 检查类型。已完成 15 道线上模型验收题与两道修复复测；本地记录 16 次上游请求，按峰时费率保守核算约 0.0053 美元。版本差异题检验解释口径，不代表已经运行两个版本的 benchmark。

## 内容与实验

审核后的正文维护在 `content/articles.json`，学习路径在 `lib/content.ts`。仅 `review_status=reviewed` 的文章进入检索；原始调研附件不直接公开。

评测组将脱敏后的 `{experiment,replays}` JSON 交给平台，数据结构见 `lib/experiments.ts`；`tests/experiments.test.ts` 中的 fixture 只用于校验，不发布为成绩。

```powershell
npm run import:experiment -- ./private-results/run.json --check
npm run import:experiment -- ./private-results/run.json
```

导入会检查状态分母、逐题结果、运行/任务/尝试与回放关联、连续事件顺序及常见凭证字段。导入后核对 `content/experiments.json` 与 `content/replays.json`，再提交发布。未知 token/费用保留 `null`，子集单独标记；回放只能展示已保存事件，不执行其中的命令。

项目仍按团队的周二至周四开发窗口规划。依据本地校园赛细则：周三晚应冻结演示，周四 12:00 截止修改；最新截止与材料要求以学校通知为准。交付需准备 README、源码、官方模板海报与不超过 3 分钟的视频。

Benchmark 已新增容器内一键脚本：`bash scripts/run-benchmark.sh init` 创建配置，`bash scripts/run-benchmark.sh plan` 查看矩阵。按用户要求剔除 3 个不可调用模型，当前为 **9 模型 × 95 题的部分复现**，另含第二裁判与 7 裁判一致性评估。配置与运行见 [远程复现记录](docs/LiveMCPBench远程复现.md)，审计发现、修复与未验证项见 [提交前审计](docs/LiveMCPBench审计.md)。尚未执行远程 GPU/API 实测，也未生成可供网站回放的实测案例。

本仓库原创内容采用 [MIT](LICENSE)；第三方资料遵循各自许可。原始实训附件与未脱敏日志不直接发布，论文报告成绩、团队实测和预设演示分开展示。
