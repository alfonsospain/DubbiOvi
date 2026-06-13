# ASR PAYLOAD SIZE FEASIBILITY REVIEW & FIX REPORT

This report investigates the `413 (Payload Too Large)` error observed during the video transcription process and details the implementation modifications required to support large audio files in **DubiOvi**.

---

## 1. Root Cause Analysis

Next.js Server Actions enforce a strict default payload body limit of **1 MB** to protect servers from memory exhaustion caused by uploading large file structures.

When transcribing video files:
- Even when downsampled to **16kHz mono 16-bit PCM WAV**, the audio file size is approximately **1.92 MB per minute** of video:
  $$\text{Size} = 16000\text{ samples/sec} \times 2\text{ bytes/sample} \times 60\text{ sec} \approx 1.92\text{ MB/minute}$$
- Any video longer than **30 seconds** will exceed the 1 MB default body size limit, causing the Next.js router to reject the request with a `413 (Payload Too Large)` response before the execution reaches the Server Action or the Gemini API.

---

## 2. Evaluation of Options

### Option 1: Increase Server Action `bodySizeLimit` (Recommended)
Configure the Server Action payload threshold directly in the Next.js config file (`next.config.ts`).

- **Pros**:
  - Requires modifying only **one file** (`next.config.ts`).
  - Preserves the existing Server Action structure without adding API Route files or client-side packages.
  - Zero performance impact on the browser thread.
- **Cons**:
  - Must remain within server host runtime limits (e.g., Vercel/App Hosting limits are typically 10 MB or 4.5 MB, which supports ~5-10 minutes of audio).

---

### Option 2: Convert WAV to MP3/Opus before Upload
Use browser-side library compressors (like `lamejs` or WASM-based Opus encoders) to compress audio before sending.

- **Pros**:
  - Compresses the audio by 10x, allowing a 15-minute file to fit into less than 1.5 MB.
- **Cons**:
  - **High Dependency Bloat**: Web Audio API does not natively encode to MP3 or Opus. Implementing this requires importing third-party WASM encoders, increasing bundle size and complicating deployment in university networks.

---

### Option 3: Route Handler with Custom Body Parser
Refactor ASR transmission from a Server Action to a Next.js App Router Route Handler (`src/app/api/transcribe/route.ts`) and override its size constraints.

- **Pros**:
  - Completely separates heavy file uploads from normal server actions.
- **Cons**:
  - Requires writing a new endpoint, parsing `multipart/form-data` manually on the server, and refactoring client fetch calls, adding unnecessary codebase complexity.

---

## 3. Recommended Solution & Code Changes

We recommend **Option 1 (Increase Server Action `bodySizeLimit` to `10mb`)** as the primary solution for DubiOvi v1.1. It provides a clean, production-ready, and lightweight correction.

### Modified File: `next.config.ts`

We will update [next.config.ts](file:///Users/alfonso/Desktop/DubiOvi/next.config.ts) to define the `experimental.serverActions.bodySizeLimit` property:

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Supports WAV audio files up to ~5 minutes
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      // existing patterns...
    ],
  },
};

export default nextConfig;
```

*Note on Mitigation*: To ensure files always fit within this 10MB ceiling, we will restrict client ASR uploads to videos under **5 minutes** in length for Version 1.1, prompting users with longer files to clip them or paste scripts.
