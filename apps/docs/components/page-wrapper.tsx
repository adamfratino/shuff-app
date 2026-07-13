import { Stack, Text } from "@uiid/design-system";

type PageWrapperProps = React.PropsWithChildren<{
  readonly title: string;
  readonly description: string;
}>;

export function PageWrapper({
  title,
  description,
  children,
}: Readonly<PageWrapperProps>) {
  return (
    <Stack data-slot="page-wrapper" px={4} pt={8} pb={32} gap={8} ax="stretch">
      <Stack data-slot="page-intro" gap={3}>
        <Text render={<h1 />} size={5} weight="semibold" family="mono">
          {title}
        </Text>
        <Text size={1} shade="muted" balance>
          {description}
        </Text>
      </Stack>
      {children}
    </Stack>
  );
}
