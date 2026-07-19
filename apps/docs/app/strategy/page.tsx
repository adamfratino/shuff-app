import { Separator } from "@uiid/design-system";

import { ExampleFrame } from "../../components/example-frame";
import { PageWrapper } from "../../components/page-wrapper";
import { STRATEGY_EXAMPLES } from "../../examples/registry";

export const metadata = {
  title: "@shuff/strategy — shuff docs",
};

export default function StrategyPage() {
  return (
    <PageWrapper
      title="@shuff/strategy"
      description="The named shots of floor shuffleboard and the engine that chooses between them — candidate generation, line-of-sight exposure, and Monte Carlo evaluation per docs/STRATEGY.md, played out through the @shuff/motion physics. Everything here is what a player would actually call the shot."
    >
      <Separator />
      {STRATEGY_EXAMPLES.map((example) => (
        <ExampleFrame key={example.id} example={example} />
      ))}
    </PageWrapper>
  );
}
