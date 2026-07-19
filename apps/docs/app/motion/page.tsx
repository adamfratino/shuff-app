import { Separator } from "@uiid/design-system";

import { ExampleFrame } from "../../components/example-frame";
import { PageWrapper } from "../../components/page-wrapper";
import { MOTION_EXAMPLES } from "../../examples/registry";

export const metadata = {
  title: "@shuff/motion — shuff docs",
};

export default function MotionPage() {
  return (
    <PageWrapper
      title="@shuff/motion"
      description="Planned animation layer on top of @shuff/diagram — Motion drives the data, the untouched Diagram renders it each frame. Strategy lives in packages/motion/PLAN.md; this page hosts the Phase 0 spike."
    >
      <Separator />
      {MOTION_EXAMPLES.map((example) => (
        <ExampleFrame key={example.id} example={example} />
      ))}
    </PageWrapper>
  );
}
