// 一時的な外部 cron ディスパッチャー。
// Vercel Cron から呼び出され、GitHub PAT で xpost.yaml の workflow_dispatch を実行する。
// TODO: GitHub App (feat/github-app-dispatcher) に移行したら PAT 認証を置き換える。

const OWNER = "raycast-jp";
const REPO = "automate-operations";
const WORKFLOW = "xpost.yaml";
const REF = "main";
// NOTE: Function 内で sleep するため、maxDuration (vercel.json) を超えない値にすること
const MAX_DELAY_MINUTES = Number(process.env.MAX_DELAY_MINUTES ?? 5);

export default async function handler(req, res) {
  // Vercel Cron は CRON_SECRET を Authorization ヘッダーに付与して呼び出す
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // 投稿時刻をランダムにずらすため、dispatch 前に 0〜MAX_DELAY_MINUTES 分 sleep する
  const delaySeconds = Math.floor(Math.random() * (MAX_DELAY_MINUTES * 60 + 1));
  console.log(`Sleeping for ${delaySeconds} seconds before dispatch...`);
  await new Promise((resolve) => setTimeout(resolve, delaySeconds * 1000));

  const response = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW}/dispatches`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${process.env.GITHUB_PAT}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ref: REF }),
    },
  );

  // workflow_dispatch 成功時は 204 No Content が返る
  if (response.status !== 204) {
    const body = await response.text();
    console.error(`workflow_dispatch failed: ${response.status} ${body}`);
    return res
      .status(502)
      .json({ error: `workflow_dispatch failed: ${response.status}`, body });
  }

  return res.status(200).json({ ok: true, dispatched: WORKFLOW, delaySeconds });
}
