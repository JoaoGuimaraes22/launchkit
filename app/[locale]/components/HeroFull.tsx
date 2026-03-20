"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";

interface Stat {
  value: string;
  label: string;
}

interface HeroDict {
  title_line1: string;
  title_line2: string;
  tagline: string;
  cta: string;
  cta_secondary: string;
  stats: Stat[];
}

const VERT = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAG = `
precision mediump float;
uniform vec2  u_resolution;
uniform vec2  u_mouse;
uniform float u_time;

float blob(vec2 uv, vec2 center, float radius) {
  float d = length(uv - center);
  float f = 1.0 - smoothstep(0.0, radius, d);
  return f * f;
}

void main() {
  float aspect = u_resolution.x / u_resolution.y;
  vec2 uv    = vec2(gl_FragCoord.x / u_resolution.y, gl_FragCoord.y / u_resolution.y);
  vec2 mouse = vec2(u_mouse.x * aspect, u_mouse.y);

  float t = u_time * 0.60;

  // 4 always-animated blobs with wide, varied orbits
  vec2 c1 = vec2(aspect * 0.30 + 0.35 * sin(t * 0.70), 0.72 + 0.22 * cos(t * 0.50));
  vec2 c2 = vec2(aspect * 0.72 + 0.28 * cos(t * 0.55), 0.32 + 0.20 * sin(t * 0.85));
  vec2 c3 = vec2(aspect * 0.18 + 0.22 * sin(t * 1.05), 0.22 + 0.28 * cos(t * 0.38));
  vec2 c4 = vec2(aspect * 0.55 + 0.30 * cos(t * 0.65), 0.60 + 0.25 * sin(t * 0.72));

  vec3 base       = vec3(0.04, 0.04, 0.12);
  vec3 col_indigo = vec3(0.31, 0.27, 0.90);
  vec3 col_violet = vec3(0.49, 0.23, 0.93);
  vec3 col_sky    = vec3(0.06, 0.55, 0.85);
  vec3 col_rose   = vec3(0.55, 0.10, 0.75);
  vec3 col_mouse  = vec3(0.45, 0.28, 1.00);

  // Black base = transparent (screen blend mode makes it invisible)
  vec3 col = vec3(0.0);
  col += col_indigo * blob(uv, c1, 0.70);
  col += col_violet * blob(uv, c2, 0.60);
  col += col_sky    * blob(uv, c3, 0.55);
  col += col_rose   * blob(uv, c4, 0.50);
  col += col_mouse  * blob(uv, mouse, 0.38) * 1.1;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  src: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compile error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export default function HeroFull({ hero }: { hero: HeroDict }) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<[number, number]>([0.5, 0.5]);
  const lerpedMouse = useRef<[number, number]>([0.5, 0.5]);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;

    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false });
    if (!gl) return;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const vert = compileShader(gl, gl.VERTEX_SHADER, VERT);
    const frag = compileShader(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vert || !frag) return;

    const program = gl.createProgram()!;
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    // Full-screen quad (2 triangles)
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const aPos = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, "u_resolution");
    const uMouse = gl.getUniformLocation(program, "u_mouse");
    const uTime = gl.getUniformLocation(program, "u_time");

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const onMouse = (e: MouseEvent) => {
      const rect = section.getBoundingClientRect();
      mouseRef.current = [
        (e.clientX - rect.left) / rect.width,
        1 - (e.clientY - rect.top) / rect.height,
      ];
    };
    section.addEventListener("mousemove", onMouse);

    let rafId: number;
    const render = () => {
      lerpedMouse.current[0] +=
        (mouseRef.current[0] - lerpedMouse.current[0]) * 0.12;
      lerpedMouse.current[1] +=
        (mouseRef.current[1] - lerpedMouse.current[1]) * 0.12;
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uTime, performance.now() / 1000);
      gl.uniform2fv(uMouse, lerpedMouse.current);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      section.removeEventListener("mousemove", onMouse);
      gl.deleteProgram(program);
      gl.deleteShader(vert);
      gl.deleteShader(frag);
      gl.deleteBuffer(buf);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="home"
      className="relative flex min-h-screen flex-col justify-end overflow-hidden bg-zinc-950"
    >
      {/* Background image — parallax */}
      <motion.div
        className="absolute inset-x-0 top-0 h-[130%] pointer-events-none select-none"
        style={{ y: bgY }}
      >
        <Image
          src="/hero.jpg"
          alt=""
          aria-hidden
          fill
          priority
          sizes="100vw"
          className="object-cover object-top"
        />
      </motion.div>

      {/* Dark overlay to let shader blobs pop */}
      <div className="absolute inset-0 bg-zinc-900/70" />

      {/* WebGL shader — screen blend so black areas show the image through */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none mix-blend-screen"
      />

      {/* Gradient overlay — keeps text legible */}
      <div className="absolute inset-0 bg-linear-to-t from-zinc-900/90 via-zinc-900/50 to-zinc-900/10" />

      {/* Content */}
      <div className="relative z-10 px-8 pb-20 pt-32 md:px-16 md:pb-28 xl:px-24">
        {/* Title */}
        <motion.div
          className="leading-none mb-10"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
        >
          <h1 className="font-black uppercase tracking-tight text-5xl sm:text-6xl md:text-7xl xl:text-[8rem] text-white">
            {hero.title_line1}
          </h1>
          <h1 className="font-black uppercase tracking-tight text-5xl sm:text-6xl md:text-7xl xl:text-[8rem] text-white/25">
            {hero.title_line2}
          </h1>
        </motion.div>

        {/* Tagline */}
        <motion.p
          className="max-w-md text-base text-white/60 leading-relaxed mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.7,
            delay: 0.15,
            ease: [0.16, 1, 0.3, 1] as const,
          }}
        >
          {hero.tagline}
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex flex-wrap gap-3 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.7,
            delay: 0.25,
            ease: [0.16, 1, 0.3, 1] as const,
          }}
        >
          <a
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById("contact")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            {hero.cta}
          </a>
          <a
            href="#work"
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById("work")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            className="rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white/80 hover:border-white/60 hover:text-white transition-colors"
          >
            {hero.cta_secondary}
          </a>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="flex flex-wrap gap-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.7,
            delay: 0.35,
            ease: [0.16, 1, 0.3, 1] as const,
          }}
        >
          {hero.stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl font-black text-white">{stat.value}</p>
              <p className="text-xs text-white/40 mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <span className="text-[10px] tracking-widest uppercase text-white/30">
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white/30"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </motion.div>
      </div>
    </section>
  );
}
