import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchAndIndexGitHubRepo, checkRateLimit } from '@/lib/repoIndex';

const RequestSchema = z.object({
  repoUrl: z.string().url().max(200),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const rate = checkRateLimit(ip);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a minute or use the "Paste instead" tab.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid repository URL. Must be a valid https://github.com/{owner}/{repo} URL (max 200 chars).' },
        { status: 400 }
      );
    }

    const token = process.env.GITHUB_TOKEN;
    const index = await fetchAndIndexGitHubRepo(parsed.data.repoUrl, token);

    return NextResponse.json(index, {
      headers: {
        'Cache-Control': 'public, max-age=600',
        'X-RateLimit-Remaining': String(rate.remaining),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to index repository';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

