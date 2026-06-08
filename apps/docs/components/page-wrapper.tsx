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
    <Stack data-slot="page-wrapper" gap={4} p={8} maxw={1080}>
      <Text size={3} weight="bold" family="mono">
        {title}
      </Text>
      <Text size={2} shade="muted" mb={12}>
        {description}
      </Text>
      {children}
    </Stack>
  );
}
