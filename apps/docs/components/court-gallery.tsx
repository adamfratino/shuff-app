import { Fragment } from "react";
import { Separator, Stack } from "@uiid/design-system";

import { galleryExamples } from "../examples/registry";
import { ExampleFrame } from "./example-frame";

/**
 * A visual tour of the Diagram component's rendering options, shown above the
 * API reference on the /diagram page.
 */
export function CourtGallery() {
  return (
    <Stack
      data-slot="court-gallery"
      id="Diagram"
      className="scroll-mt-16"
      gap={6}
      ax="stretch"
      fullwidth
    >
      {galleryExamples.map((example, i) => (
        <Fragment key={example.id}>
          {i > 0 && <Separator my={6} />}
          <ExampleFrame example={example} />
        </Fragment>
      ))}
    </Stack>
  );
}
