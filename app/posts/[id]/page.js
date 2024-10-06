const React = require("react");

function PostPage({ params }) {
  const { id } = params;
  return (
    <div>
      <h1>Post Page ID: {id}</h1>
      <a href="/">Home</a>
    </div>
  );
}

module.exports = PostPage;
