const React = require("react");

function HomePage() {
  return (
    <div>
      <h1>Home Page</h1>
      <a href="/dashboard">Dashboard</a>
      <br />
      <a href="/posts/1">Post 1</a>
      <br />
      <a href="/posts/2">Post 2</a>
    </div>
  );
}

module.exports = HomePage;
