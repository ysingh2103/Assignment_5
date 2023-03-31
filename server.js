/*********************************************************************************
*  WEB322 – Assignment 05
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: ___Yuvraj Singh______ Student ID: _156150211__ Date: __30 March 2023_____
*
*  Cyclic Web App URL: 
*
*  GitHub Repository URL: 
*
********************************************************************************/ 

const express = require('express');
const blog = require("./blog-service");
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const path = require("path");
const app = express();
const exphbs = require('express-handlebars');
const stripJs = require('strip-js');

const HTTP_PORT = process.env.PORT || 8080;

cloudinary.config({
    cloud_name: 'dc2nntrak',
    api_key: '614349154552387',
    api_secret: 'lAbeE7LOFa-yqE7pdx3L64t1w_E',
    secure: true
  });

const upload = multer();

app.use(express.static('public'));
app.engine('.hbs', exphbs.engine({ extname: '.hbs' }));
app.set('view engine', '.hbs');


app.use(function (req, res, next) {
    let route = req.path.substring(1);
    app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    app.locals.viewingCategory = req.query.category;
    next();
});

app.use(express.urlencoded({ extended: true }));

app.engine('.hbs', exphbs.engine({
    extname: '.hbs',
    helpers: {
        navLink: function (url, options) {
            return '<li' +
                ((url == app.locals.activeRoute) ? ' class="active" ' : '') +
                '><a href="' + url + '">' + options.fn(this) + '</a></li>';
        }, equal: function (lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        }, safeHTML: function (context) {
            return stripJs(context);
        }, formatDate: function (dateObj) {
            let year = dateObj.getFullYear();
            let month = (dateObj.getMonth() + 1).toString();
            let day = dateObj.getDate().toString();
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
    }
}));




app.get('/', (req, res) => {
    res.redirect("/blog");
});

app.get('/about', (req, res) => {
    res.render('about');
});

app.get('/blog', async (req, res) => {

    // Declare an object to store properties for the view
    let viewData = {};

    try {

        // declare empty array to hold "post" objects
        let posts = [];

        // if there's a "category" query, filter the returned posts by category
        if (req.query.category) {
            // Obtain the published "posts" by category
            posts = await blog.getPublishedPostsByCategory(req.query.category);
        } else {
            // Obtain the published "posts"
            posts = await blog.getPublishedPosts();
        }

        // sort the published posts by postDate
        posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

        // get the latest post from the front of the list (element 0)
        let post = posts[0];

        // store the "posts" and "post" data in the viewData object (to be passed to the view)
        viewData.posts = posts;
        viewData.post = post;

    } catch (err) {
        viewData.message = "no results";
    }

    try {
        // Obtain the full list of "categories"
        let categories = await blog.getCategories();

        // store the "categories" data in the viewData object (to be passed to the view)
        viewData.categories = categories;
    } catch (err) {
        viewData.categoriesMessage = "no results"
    }

    // render the "blog" view with all of the data (viewData)
    res.render("blog", { data: viewData })

});

app.get('/blog/:id', async (req, res) => {

    // Declare an object to store properties for the view
    let viewData = {};

    try {

        // declare empty array to hold "post" objects
        let posts = [];

        // if there's a "category" query, filter the returned posts by category
        if (req.query.category) {
            // Obtain the published "posts" by category
            posts = await blog.getPublishedPostsByCategory(req.query.category);
        } else {
            // Obtain the published "posts"
            posts = await blog.getPublishedPosts();
        }

        // sort the published posts by postDate
        posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

        // store the "posts" and "post" data in the viewData object (to be passed to the view)
        viewData.posts = posts;

    } catch (err) {
        viewData.message = "no results";
    }

    try {
        // Obtain the post by "id"
        viewData.post = await blog.getPostById(req.params.id);
    } catch (err) {
        viewData.message = "no results";
    }

    try {
        // Obtain the full list of "categories"
        let categories = await blog.getCategories();

        // store the "categories" data in the viewData object (to be passed to the view)
        viewData.categories = categories;
    } catch (err) {
        viewData.categoriesMessage = "no results"
    }

    // render the "blog" view with all of the data (viewData)
    res.render("blog", { data: viewData })
});

app.get('/posts', (req, res) => {

    let queryPromise = null;

    if (req.query.category) {
        queryPromise = blog.getPostsByCategory(req.query.category);
    } else if (req.query.minDate) {
        queryPromise = blog.getPostsByMinDate(req.query.minDate);
    } else {
        queryPromise = blog.getAllPosts()
    }

    queryPromise.then(data => {
        data.length > 0
            ? res.render("posts", { posts: data })
            : res.render("posts", { message: "No Results" });
    }).catch(err => {
        res.render("posts", { message: "No Results" });
    })

});

app.post("/posts/add", upload.single("featureImage"), (req, res) => {

    if (req.file) {
        let streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream(
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );

                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };

        async function upload(req) {
            let result = await streamUpload(req);
            console.log(result);
            return result;
        }

        upload(req).then((uploaded) => {
            processPost(uploaded.url);
        });
    } else {
        processPost("");
    }

    function processPost(imageUrl) {
        req.body.featureImage = imageUrl;

        blog.addPost(req.body).then(post => {
            res.redirect("/posts");
        }).catch(err => {
            res.status(500).send(err);
        })
    }
});

app.get('/posts/add', (req, res) => {
    blog.getCategories()
        .then((categories) => {
            res.render("addPost", { categories: categories });
        })
        .catch(() => {
            res.render("addPost", { categories: [] });
        });
});

app.get('/post/:id', (req, res) => {
    blog.getPostById(req.params.id).then(data => {
        res.json(data);
    }).catch(err => {
        res.json({ message: err });
    });
});

app.get('/categories', (req, res) => {
    blog.getCategories().then((data => {
        data.length > 0
            ? res.render("categories", { categories: data })
            : res.render("categories", { message: "No Results" });
    })).catch(err => {
        res.render("categories", { message: "no results" });
    });
});


app.get("/categories/add", (req, res) => {
    res.render("addCategory");
});

app.post("/categories/add", (req, res) => {
    let catObject = {};
    // Add it Category before redirecting to /categories
    catObject.category = req.body.category;
    console.log(req.body.category);
    if (req.body.category != "") {
        blog.addCategory(catObject)
            .then(() => {
                res.redirect("/categories");
            })
            .catch(() => {
                console.log("Some error occured");
            });
    }
});

app.get("/categories/delete/:id", (req, res) => {
    blog.deleteCategoryById(req.params.id)
        .then(() => {
            res.redirect("/categories");
        })
        .catch(() => {
            console.log("Unable to remove category / Category not found");
        });
});

app.get("/posts/delete/:id", (req, res) => {
    blog.deletePostById(req.params.id)
        .then(() => {
            res.redirect("/posts");
        })
        .catch(() => {
            console.log("Unable to remove category / Category not found");
        });
});


app.use((req, res) => {
    res.status(404).send("404")
})

blog.initialize().then(() => {
    app.listen(HTTP_PORT, () => {
        console.log('server listening on: ' + HTTP_PORT);
    });
}).catch((err) => {
    console.log(err);
})


