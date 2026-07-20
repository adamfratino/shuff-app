import { Fragment } from "react";
import { CodeBlock, Separator, Stack, Text } from "@uiid/design-system";
import { TEXT_MAX_WIDTH } from "@/constants";

import { ExampleFrame } from "../../components/example-frame";
import { PageWrapper } from "../../components/page-wrapper";
import { MOTION_EXAMPLES } from "../../examples/registry";
import { highlightCached } from "../../lib/highlight";

export const metadata = {
  title: "@shuff/motion — shuff docs",
};

const JAM_MODEL_USAGE = `import { launchSpeed, glideLength, glideDuration } from "@shuff/motion";

launchSpeed(120); // ≈ 196 in/s release speed
glideDuration(120); // ≈ 1.22 s to come to rest
glideLength(140); // ≈ 61 in of follow-through for the struck disc`;

const BYO_RENDERER_USAGE = `// The whole model, dependency-free — no @shuff/motion required:
const MU = 160; // court speed: deceleration in in/s²
const glideDuration = (inches: number) => Math.sqrt((2 * inches) / MU);
const EASE_GLIDE = "cubic-bezier(0.33, 0.67, 0.67, 1)"; // exact 1-(1-t)²

// Glide an element \`dist\` inches downcourt, at \`scale\` px per inch:
function shoot(disc: HTMLElement, dist: number, scale = 4) {
  disc.animate(
    { translate: \`0 \${-dist * scale}px\` },
    {
      duration: glideDuration(dist) * 1000,
      easing: EASE_GLIDE,
      fill: "forwards",
    },
  );
}`;

async function BringYourOwnRenderer() {
  return (
    <Stack
      data-slot="entry-block"
      render={<section />}
      id="bring-your-own-renderer"
      data-title="Bring your own renderer"
      ax="stretch"
      gap={8}
      style={{ scrollMarginBlockStart: 80 }}
    >
      <Text render={<h2 />} size={4} weight="semibold">
        Bring your own renderer
      </Text>
      <CodeBlock
        code={BYO_RENDERER_USAGE}
        html={await highlightCached(BYO_RENDERER_USAGE)}
        language="typescript"
        filename="byo-renderer.ts"
        rows={16}
      />
      <Stack gap={4} maxw={TEXT_MAX_WIDTH}>
        <Text>
          Because deceleration is constant, you never integrate per frame: every
          glide reduces to a straight line, a duration, and a quadratic
          ease-out. Any animation system that accepts those can play the model
          back exactly — the Web Animations API above, a CSS transition, Motion,
          GSAP, or a game engine tween. The beziers are exact, not
          approximations: quadratics are perfectly representable as cubics, so{" "}
          <code>cubic-bezier(0.33, 0.67, 0.67, 1)</code> <em>is</em> the
          friction curve, and <code>cubic-bezier(0.33, 0, 0.67, 0.33)</code> (
          <code>EASE_STROKE</code>) is its mirror-image t² for the cue stroke.
        </Text>
        <Text>
          The full recipe for a shot: pick where the disc should die, get the
          duration from <code>glideDuration</code>, and animate with{" "}
          <code>EASE_GLIDE</code>. For a struck disc, it leaves at the impact
          speed v and glides <code>glideLength(v)</code> inches along the line
          of centers over v/μ seconds — same curve, new heading. Coordinates,
          scale, and drawing are entirely your renderer's business.
        </Text>
      </Stack>
    </Stack>
  );
}

async function JamModel() {
  return (
    <Stack
      data-slot="entry-block"
      render={<section />}
      id="jam-model"
      data-title="The Jam model"
      ax="stretch"
      gap={8}
      style={{ scrollMarginBlockStart: 80 }}
    >
      <Text render={<h2 />} size={4} weight="semibold">
        The "Jam" model
      </Text>
      <CodeBlock
        code={JAM_MODEL_USAGE}
        html={await highlightCached(JAM_MODEL_USAGE)}
        language="typescript"
        filename="jam-model.ts"
        rows={14}
      />
      <Stack gap={4} maxw={TEXT_MAX_WIDTH}>
        <Text>
          Our physics are adopted from{" "}
          <a href="https://shuffleboardjam.com/" className="underline">
            shuffleboardjam.com
          </a>
          , a playable floor-shuffleboard simulator built in the same inch-based
          court coordinates. Full credit for the model goes to project creator
          Jeff Ziev — we treat its feel as the accuracy benchmark and summarize
          its rules here for anyone building shuffleboard tools.
        </Text>
        <Stack my={2} bl={1}>
          <Text render={<blockquote />} shade="muted" pl={4} className="italic">
            A gliding disc decelerates under Coulomb friction: a constant μ =
            160 in/s² (<code>DEFAULT_MU</code> — the court-speed knob; lower μ
            is a faster, beaded court). Everything follows analytically: a disc
            released at speed v stops after v²/2μ inches in v/μ seconds, so the
            launch speed that dies exactly at distance d is √(2μd). Collisions
            are perfectly elastic between equal masses — the striking disc hands
            its velocity component along the line of centers to the struck disc,
            so a head-on hit stops the shooter dead and sends the target off at
            full speed.
          </Text>
        </Stack>
        <Text>
          The entire model is three one-line formulas and two easing constants —{" "}
          <code>physics.ts</code> is under fifty lines, so you can adopt it in
          any renderer, not just ours.
        </Text>
        <Text>
          Friction and collisions assume a level court; real ones aren't.
          Outdoor courts <em>drift</em> — the reference sim's signature feature
          — so <code>simulateShot</code> takes a <code>drift</code> option, a
          constant downhill acceleration layered on the glide. Because friction
          fights the disc's actual velocity, the bias tells as the disc slows:
          it runs nearly true at speed, then hooks off the low side, which is
          why players read the court and aim up-slope. That curve has no closed
          form, so drift is stepped numerically (<code>frictionStep</code>, the
          same primitive <code>simulateShot</code> runs) rather than played as
          one analytic ease — see the drift example below.
        </Text>
      </Stack>
    </Stack>
  );
}

export default function MotionPage() {
  return (
    <PageWrapper
      title="@shuff/motion"
      description="Animation layer on top of @shuff/diagram — Motion drives the data, the untouched Diagram renders it each frame. Strategy lives in packages/motion/PLAN.md; this page hosts the Phase 0 physics spike and the Phase 1 board-transition primitive."
    >
      <Separator />
      <JamModel />
      <Separator />
      <BringYourOwnRenderer />
      <Separator />
      {MOTION_EXAMPLES.map((example) => (
        <Fragment key={example.id}>
          <ExampleFrame example={example} />
          <Separator />
        </Fragment>
      ))}
    </PageWrapper>
  );
}
