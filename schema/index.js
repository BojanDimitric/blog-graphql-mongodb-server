const graphql = require('graphql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const {
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLID,
    GraphQLString,
    GraphQLList,
    GraphQLNonNull,
    GraphQLError
} = graphql;

const Users = require('../models/user');
const Blogs = require('../models/blog');
const Posts = require('../models/post');
const Comments = require('../models/comment');

const Auth = new GraphQLObjectType({
    name: 'Auth',
    fields: () => ({
        id: { type: GraphQLID },
        user: { type: GraphQLID },
        token: { type: GraphQLString },
        expiry: { type: GraphQLString },
    })
});

const User = new GraphQLObjectType({
    name: 'User',
    fields: () => ({
        id: { type: GraphQLID },
        mail: { type: GraphQLString },
        pass: { type: GraphQLString },
        blogs: {
            type: new GraphQLList(Blog),
            resolve: (parent, args) => {
                return Blogs.find({ user: parent.id });
            }
        }
    })
});

const Blog = new GraphQLObjectType({
    name: 'Blog',
    fields: () => ({
        id: { type: GraphQLID },
        name: { type: GraphQLString },
        user: {
            type: User,
            resolve: (parent, args) => {
                return Users.findById(parent.user);
            }
        },
        posts: {
            type: new GraphQLList(Post),
            resolve: (parent, args) => {
                return Posts.find({ blog: parent.id });
            }
        }
    })
});

const Post = new GraphQLObjectType({
    name: 'Post',
    fields: () => ({
        id: { type: GraphQLID },
        category: { type: GraphQLString },
        title: { type: GraphQLString },
        body: { type: GraphQLString },
        blog: {
            type: Blog,
            resolve: (parent, args) => {
                return Blogs.findById(parent.blog);
            }
        },
        comments: {
            type: new GraphQLList(Comment),
            resolve: (parent, args) => {
                return Comments.find({ post: parent.id });
            }
        }
    })
});

const Comment = new GraphQLObjectType({
    name: 'Comment',
    fields: () => ({
        id: { type: GraphQLID },
        comment: { type: GraphQLString },
        post: {
            type: Post,
            resolve: (parent, args) => {
                return Posts.findById(parent.post);
            }
        }
    })
});

const Queries = new GraphQLObjectType({
    name: 'Queries',
    fields: {
        blog: {
            type: Blog,
            args: {
                id: { type: GraphQLID }
            },
            resolve: (parent, args, req) => {
                // if (!req.isAuth) {
                //     throw new Error('Unauthenticated!');
                // };
                return Blogs.findById(args.id);
            }
        },
        blogs: {
            type: new GraphQLList(Blog),
            args: {
                user: { type: GraphQLID }
            },
            resolve: (parent, args) => {
                return Blogs.find({ user: args.user });
            }
        },
        post: {
            type: Post,
            args: {
                id: { type: GraphQLID }
            },
            resolve: (parent, args) => {
                return Posts.findById(args.id)
            }
        },
        posts: {
            type: new GraphQLList(Post),
            args: {
                blog: { type: GraphQLID }
            },
            resolve: (parent, args) => {
                return Posts.find({ blog: args.blog });
            }
        },
        comment: {
            type: Comment,
            args: {
                id: { type: GraphQLID }
            },
            resolve: (parent, args) => {
                return Comments.findById(args.id)
            }
        },
        comments: {
            type: new GraphQLList(Comment),
            args: {
                blog: { type: GraphQLID }
            },
            resolve: (parent, args) => {
                return Comments.find({ blog: args.blog });
            }
        }
    }
});

const Mutations = new GraphQLObjectType({
    name: 'Mutations',
    fields: {
        createUser: {
            type: User,
            args: {
                mail: { type: new GraphQLNonNull(GraphQLString) },
                pass: { type: new GraphQLNonNull(GraphQLString) }
            },
            resolve: async (parent, args) => {
                try {
                    const exists = await Users.findOne({ mail: args.mail });
                    if (exists) {
                        throw new GraphQLError('User already exists!');
                    };

                    const hashedPass = await bcrypt.hash(args.pass, 12);
                    const user = new Users({
                        mail: args.mail,
                        pass: hashedPass
                    });

                    const result = await user.save();

                    return {
                        ...result,
                        id: result._id,
                        pass: null
                    };
                } catch (err) {
                    throw err;
                };
            }
        },
        loginUser: {
            type: Auth,
            args: {
                mail: { type: new GraphQLNonNull(GraphQLString) },
                pass: { type: new GraphQLNonNull(GraphQLString) }
            },
            resolve: async (parent, args) => {
                const user = await Users.findOne({ mail: args.mail });
                if (!user) {
                    throw new GraphQLError('User does not exist!');
                };

                const equal = await bcrypt.compare(args.pass, user.pass);
                if (!equal) {
                    throw new GraphQLError('Password is incorrect!');
                };

                const token = jwt.sign({
                    id: user.id,
                    mail: user.mail
                },
                    'somesupersecretkey',
                    {
                        expiresIn: '1h'
                    });

                return {
                    user: user.id,
                    token: token,
                    expiry: 1
                };
            }
        },
        createBlog: {
            type: Blog,
            args: {
                name: { type: new GraphQLNonNull(GraphQLString) },
                user: { type: new GraphQLNonNull(GraphQLID) }
            },
            resolve: (parent, args) => {
                const blog = new Blogs({
                    name: args.name,
                    user: args.user
                });
                return blog.save();
            }
        },
        deleteBlog: {
            type: Blog,
            args: {
                id: { type: new GraphQLNonNull(GraphQLID) }
            },
            resolve: (parent, args) => {
                return Blogs.findByIdAndRemove(args.id)
            }
        },
        createPost: {
            type: Post,
            args: {
                category: { type: new GraphQLNonNull(GraphQLString) },
                title: { type: new GraphQLNonNull(GraphQLString) },
                body: { type: new GraphQLNonNull(GraphQLString) },
                blog: { type: new GraphQLNonNull(GraphQLID) }
            },
            resolve: (parent, args) => {
                const post = new Posts({
                    category: args.category,
                    title: args.title,
                    body: args.body,
                    blog: args.blog
                });
                return post.save();
            }
        },
        updatePost: {
            type: Post,
            args: {
                id: { type: new GraphQLNonNull(GraphQLID) },
                category: { type: new GraphQLNonNull(GraphQLString) },
                title: { type: new GraphQLNonNull(GraphQLString) },
                body: { type: new GraphQLNonNull(GraphQLString) },
                blog: { type: new GraphQLNonNull(GraphQLID) }
            },
            resolve: (parent, args) => {
                const update = {
                    category: args.category,
                    title: args.title,
                    body: args.body,
                    blog: args.blog
                };
                return Posts.findByIdAndUpdate(args.id, update, { 'new': true });
            }
        },
        deletePost: {
            type: Post,
            args: {
                id: { type: new GraphQLNonNull(GraphQLID) }
            },
            resolve: (parent, args) => {
                return Posts.findByIdAndRemove(args.id);
            }
        },
        createComment: {
            type: Comment,
            args: {
                comment: { type: new GraphQLNonNull(GraphQLString) },
                post: { type: new GraphQLNonNull(GraphQLID) }
            },
            resolve: (parent, args) => {
                const comment = new Comments({
                    comment: args.comment,
                    post: args.post
                });
                return comment.save();
            }
        },
        deleteComments: {
            type: Comment,
            args: {
                post: { type: new GraphQLNonNull(GraphQLID) }
            },
            resolve: (parent, args) => {
                return Comments.deleteMany({ post: args.post });
            }
        }
    }
});

module.exports = new GraphQLSchema({
    query: Queries,
    mutation: Mutations
});