const Sequelize = require('sequelize');
const { gte } = Sequelize.Op;


var sequelize = new Sequelize('fpnqgxsm', 'fpnqgxsm', '4JAL6xnmw8JPM8AwgMtJpzVd2wSn9dZ5', {
  host: 'ruby.db.elephantsql.com',
  dialect: 'postgres',
  port: 5432,
  dialectOptions: {
      ssl: { rejectUnauthorized: false }
  },
  query: { raw: true }
});

var Post = sequelize.define('Post',{
  body: Sequelize.TEXT,
  title: Sequelize.STRING,
  postDate: Sequelize.DATE,
  featureImage: Sequelize.STRING,
  published:Sequelize.BOOLEAN,
})
var Category = sequelize.define('Category',{
  category: Sequelize.STRING,
})

Post.belongsTo(Category, {foreignKey: 'category'});

module.exports.initialize = function () {
  return new Promise((resolve, reject) => {
      sequelize
          .sync()
          .then(() => {
              resolve();
          })
          .catch(() => {
              reject("Unable to sync to the database.");
          });
  });

}

module.exports.getAllPosts = function () {
  return new Promise((resolve, reject) => {
      Post.findAll()
          .then((data) => {
              resolve(data);
          })
          .catch(() => {
              reject("No results returned");
          });
  });

}

module.exports.getPostsByCategory = function (category) {
  return new Promise((resolve, reject) => {
      Post.findAll({
          where: {
              category: category,
          },
      })
          .then((data) => {
              resolve(data);
          })
          .catch(() => {
              reject("No results returned");
          });
  });

}

module.exports.getPostsByMinDate = function (minDateStr) {
  return new Promise((resolve, reject) => {
      Post.findAll({
          where: {
              postDate: {
                  [gte]: new Date(minDateStr),
              },
          },
      })
          .then((data) => {
              resolve(data);
          })
          .catch(() => {
              reject("No results returned");
          });
  });

}

module.exports.getPostById = function (id) {
  return new Promise((resolve, reject) => {
      Post.findAll({
          where: {
              id: id,
          },
      })
          .then((data) => {
              resolve(data[0]);
          })
          .catch(() => {
              reject("No results returned");
          });
  });

}

module.exports.addPost = function (postData) {
  return new Promise((resolve, reject) => {
      postData.published = postData.published ? true : false;
      for (const i in postData) {
          if (postData[i] === "") {
              postData[i] = null;
          }
      }

      // Setting the date
      postData.postDate = new Date();

      // Create a new Post using the postData
      Post.create(postData)
          .then(() => {
              resolve();
          })
          .catch((err) => {
              reject("Unable to create post");
          });
  });

}

module.exports.getPublishedPosts = function () {
  return new Promise((resolve, reject) => {
      Post.findAll({
          where: {
              published: true,
          },
      })
          .then((data) => {
              resolve(data);
          })
          .catch(() => {
              reject("No results returned");
          });
  });

}

module.exports.getPublishedPostsByCategory = function () {
  return new Promise((resolve, reject) => {
      Post.findAll({
          where: {
              category: category,
              published: true,
          },
      })
          .then((data) => {
              resolve(data);
          })
          .catch(() => {
              reject("No results returned");
          });
  });

}


module.exports.getCategories = function () {
  return new Promise((resolve, reject) => {
      Category.findAll()
          .then((data) => {
              resolve(data);
          })
          .catch(() => {
              reject("No results returned");
          });
  });
}

module.exports.addCategory = function (categoryData) {
  return new Promise((resolve, reject) => {
      for (let i in categoryData) {
          if (categoryData[i] === "") {
              categoryData[i] = null;
          }
      }

      Category.create(categoryData)
          .then((category) => {
              resolve(category);
          })
          .catch(() => {
              reject("unable to create category");
          });
  });
}

module.exports.deleteCategoryById = function (id) {
  return new Promise((resolve, reject) => {
      Category.destroy({
          where: {
              id: id,
          },
      })
          .then(() => {
              resolve("Destroyed");
          })
          .catch(() => {
              reject("Unable to delete category");
          });
  });
}

module.exports.deletePostById = function (id) {
  return new Promise((resolve, reject) => {
      Post.destroy({
          where: {
              id: id,
          },
      })
          .then(() => {
              resolve("Destroyed");
          })
          .catch(() => {
              reject("Unable to delete post");
          });
  });
}