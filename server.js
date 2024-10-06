require("@babel/register")({
  presets: ["@babel/preset-react"],
});

const http = require("http");
const fs = require("fs").promises;
const path = require("path");
const React = require("react");
const ReactDOMServer = require("react-dom/server");

const routes = new Map();

const buildRoutes = async (dir, baseRoute = "") => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      let routePath = path.join(baseRoute, entry.name).replace(/\\/g, "/");

      if (entry.isDirectory()) {
        if (isDynamicRoute(entry.name)) {
          const paramName = getDynamicParamName(entry.name);
          routePath = path.join(baseRoute, `:${paramName}`).replace(/\\/g, "/");
        }
        await buildRoutes(fullPath, routePath);
      } else if (isPageFile(entry)) {
        registerRoute(fullPath, baseRoute);
      }
    })
  );
};

const isDynamicRoute = (dirName) =>
  dirName.startsWith("[") && dirName.endsWith("]");

const getDynamicParamName = (dirName) => dirName.slice(1, -1);

const isPageFile = (entry) => entry.isFile() && entry.name === "page.js";

const registerRoute = (fullPath, baseRoute) => {
  const routeKey =
    baseRoute === "" || baseRoute === "/"
      ? "/"
      : baseRoute.replace("/page.js", "");

  if (require.cache[require.resolve(fullPath)]) {
    delete require.cache[require.resolve(fullPath)];
  }

  const handler = require(fullPath);
  routes.set(routeKey, handler);
  console.log(`Registered route: ${routeKey}`);
};

const matchRoute = (urlPath) => {
  const pathParts = urlPath.split("/").filter(Boolean);
  return Array.from(routes).reduce((acc, [route, handler]) => {
    if (acc) return acc;

    const routeParts = route.split("/").filter(Boolean);
    if (routeParts.length !== pathParts.length) return null;

    const params = {};
    return isMatchingRoute(routeParts, pathParts, params)
      ? { handler, params }
      : null;
  }, null);
};

const isMatchingRoute = (routeParts, pathParts, params) => {
  return routeParts.every((routePart, i) => {
    if (routePart.startsWith(":")) {
      const paramName = routePart.slice(1);
      params[paramName] = pathParts[i];
      return true;
    }
    return routePart === pathParts[i];
  });
};

const startServer = async () => {
  await buildRoutes(path.join(__dirname, "app"));

  http
    .createServer(async (req, res) => {
      const match = matchRoute(req.url);
      match ? handleRequest(match, res) : handleNotFound(res);
    })
    .listen(3000, () => {
      console.log("Server is listening on port 3000");
    });
};

const handleRequest = async (match, res) => {
  try {
    const element = React.createElement(match.handler, {
      params: match.params,
    });
    const html = ReactDOMServer.renderToString(element);

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(renderHtml(html));
  } catch (err) {
    handleError(res, err);
  }
};

const handleNotFound = (res) => {
  res.writeHead(404);
  res.end("Not Found");
};

const handleError = (res, err) => {
  res.writeHead(500);
  res.end("Internal Server Error");
  console.error(err);
};

const renderHtml = (html) => `
  <!DOCTYPE html>
  <html>
    <head>
      <title>My App</title>
    </head>
    <body>
      <div id="root">${html}</div>
    </body>
  </html>
`;

startServer();
