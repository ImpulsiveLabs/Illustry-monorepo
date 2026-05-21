const ADD_IN_ID = '53f9e4f7-b86d-46c0-99e1-87a3e5d3a0c4';

const escapeXml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/"/g, '&quot;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

const GET = (request: Request) => {
  const origin = new URL(request.url).origin;
  const safeOrigin = escapeXml(origin);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<OfficeApp
  xmlns="http://schemas.microsoft.com/office/appforoffice/1.1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:bt="http://schemas.microsoft.com/office/officeappbasictypes/1.0"
  xsi:type="TaskPaneApp">
  <Id>${ADD_IN_ID}</Id>
  <Version>1.0.0.0</Version>
  <ProviderName>Illustry</ProviderName>
  <DefaultLocale>en-US</DefaultLocale>
  <DisplayName DefaultValue="Illustry Visualization" />
  <Description DefaultValue="Render an interactive Illustry visualization in Excel and sync it from workbook cell data." />
  <IconUrl DefaultValue="${safeOrigin}/icon.ico" />
  <HighResolutionIconUrl DefaultValue="${safeOrigin}/icon.ico" />
  <SupportUrl DefaultValue="${safeOrigin}" />
  <AppDomains>
    <AppDomain>${safeOrigin}</AppDomain>
  </AppDomains>
  <Hosts>
    <Host Name="Workbook" />
  </Hosts>
  <DefaultSettings>
    <SourceLocation DefaultValue="${safeOrigin}/office/excel" />
  </DefaultSettings>
  <Permissions>ReadWriteDocument</Permissions>
</OfficeApp>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Content-Disposition': 'attachment; filename="illustry-excel-addin-manifest.xml"'
    }
  });
};

export { GET };
