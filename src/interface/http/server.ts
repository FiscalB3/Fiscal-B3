import { createApp } from "./createApp";
import { createMockPorts } from "./mocks";

const port = Number.parseInt(process.env.PORT ?? "3000", 10);
const app = createApp(createMockPorts());

app.listen(port, () => {
  console.log(`Fiscal B3 API listening on http://localhost:${port}`);
});
