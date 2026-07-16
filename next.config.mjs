/** @type {import('next').NextConfig} */
export default {
  images: { remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }] },
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};
