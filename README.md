# Higgsfield app templates

Production-ready app templates on Next.js 16, Tailwind v4 and shadcn, generating
through the [Higgsfield platform API](https://platform.higgsfield.ai). Shipped as
a [shadcn registry](https://ui.shadcn.com/docs/registry), so one command
scaffolds a project and one command adds a model.

Templates: **studio** (available now), preset and app-detail (next).

## One command, new project

Run from a directory that is not already a project:

```sh
# studio with every model
pnpm dlx shadcn@latest init -t next -n my-studio --no-monorepo -y higgsfield-ai/app-templates/studio

# studio with an empty model catalog
pnpm dlx shadcn@latest init -t next -n my-studio --no-monorepo -y higgsfield-ai/app-templates/studio-bare

# studio with a chosen set of models
pnpm dlx shadcn@latest init -t next -n my-studio --no-monorepo -y \
  higgsfield-ai/app-templates/studio-bare \
  higgsfield-ai/app-templates/seedance-2.5 \
  higgsfield-ai/app-templates/kling-3
```

Then:

```sh
cd my-studio && pnpm dev
```

Open http://localhost:3000, click **Add key** in the sidebar and paste your
platform key (`id:secret`) from https://cloud.higgsfield.ai. The key is stored
in an httpOnly cookie; the browser never talks to the platform directly.

The repo is private for now, so the CLI needs GitHub access: `gh auth login`
or `GH_TOKEN` with read access to `higgsfield-ai/app-templates`.

## Add or update models

Every model is one file in `generation/catalog/models/`. The dev server watches
that directory and regenerates the barrel, so a freshly added model shows up in
the picker without a restart.

```sh
pnpm dlx shadcn@latest list   higgsfield-ai/app-templates
pnpm dlx shadcn@latest search higgsfield-ai/app-templates -q kling
pnpm dlx shadcn@latest add    higgsfield-ai/app-templates/seedance-2.5
pnpm dlx shadcn@latest add    higgsfield-ai/app-templates/models          # all of them
pnpm dlx shadcn@latest add    higgsfield-ai/app-templates/kling-3 --overwrite   # refresh
```

Pin a version with `#ref`: `higgsfield-ai/app-templates/studio#v1.0.0`.

## Environment

`shadcn init` writes these to `.env.local`:

| Variable                | Purpose                                                        |
| ----------------------- | -------------------------------------------------------------- |
| `HF_API_BASE_URL`       | Platform API base, prefilled with `https://platform.higgsfield.ai` |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token; only needed for reference-media uploads     |

## Working on the templates

```sh
git clone git@github.com:higgsfield-ai/app-templates.git
cd app-templates && pnpm install && cp .env.example .env && pnpm dev
```

| Command               | What it does                                                    |
| --------------------- | --------------------------------------------------------------- |
| `pnpm dev`            | Dev server on :3000 (also serves the built registry at `/r/*`) |
| `pnpm typecheck`      | `tsc --noEmit`                                                  |
| `pnpm models`         | Regenerate the models barrel and `models/registry.json`         |
| `pnpm registry:build` | `pnpm models` + `shadcn build` → `public/r/*.json`              |
| `pnpm build`          | Production build (runs `registry:build` first)                  |

Add a model: create `generation/catalog/models/<name>.ts` with a default export
(see any neighbour), run `pnpm models`, then
`pnpm exec shadcn registry validate ./registry.json`. Commit and push; GitHub
addresses resolve against the default branch.

Test the registry locally from another directory:

```sh
pnpm dlx shadcn@latest list http://localhost:3000/r/registry.json
pnpm dlx shadcn@latest add  http://localhost:3000/r/seedance-2.5.json
```

## Layout

```
app/                     Next.js App Router, globals.css, /api/blob upload route
layouts/studio.tsx       The Studio screen (read layouts/AGENTS.md)
components/studio/       Prompt dock, gallery, dialogs, presets (read components/studio/AGENTS.md)
components/ui/           shadcn primitives (Base UI)
generation/              Platform client, server actions, polling, stores
generation/catalog/      Model catalog: models/*.ts, mappers, generated barrel
lib/studio/              Browser-local history (IndexedDB), projects, uploads, useRuns
registry.json            shadcn registry root (studio, studio-bare; models are included)
scripts/sync-models.mjs  Regenerates the barrel + models registry
```

No `src/` directory, on purpose: the shadcn Next template uses a root layout,
and template files have to land on top of it.

`AGENTS.md` is the contract for agents adapting a scaffolded app.
