var Campground = require("../models/campground");
var Comment = require("../models/comment");
var Review = require("../models/review");

// all middleware goes here

var middlewareObj = {};

middlewareObj.checkCampgroundOwnership = function(req, res, next){
    //is user logged in?
    if(req.isAuthenticated()){        
        Campground.findById(req.params.id, function(err, foundCampgrounds){
            if(err){
                req.flash("error", "Campground not found!");
                console.log(err);
            }
            else{
                //does user own the campground?
                    // foundCampgrounds.author.id     ->    it is a mongoose Object
                    // req.user._id                   ->    it is a String
                        //both looks alike when printed, but they are different. So we cannot compare them directly using '===' or '==', rather we have to use a mongoose method "equals()"
                if(foundCampgrounds.author.id.equals(req.user._id)){
                    next();
                }
                else{
                    req.flash("error", "You dont't have permission to do that!");
                    res.redirect("back");
                }                    
            }
        });
    }
    else{
        req.flash("error", "You need to be logged in to do that!");
        res.redirect("back"); // it redirects the user back to the page from where it came from  
    }

    
    //otherwise, redirect
    //if not, redirect
    
}

middlewareObj.checkCommentOwnership = function(req, res, next){
    //is user logged in?
    if(req.isAuthenticated()){        
        Comment.findById(req.params.comment_id, function(err, foundComment){
            if(err){
                res.redirect("back");
            }
            else{
                //does user own the Comment
                if(foundComment.author.id.equals(req.user._id)){
                    next();
                }
                else{
                    req.flash("error", "You dont't have permission to do that!");
                    res.redirect("back");
                }                    
            }
        });
    }
    else{
        req.flash("error", "You need to be logged in to do that!");
        res.redirect("back"); // it redirects the user back to the page from where it came from  
    }
};


middlewareObj.isLoggedIn = function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You need to be logged in to do that!");
    res.redirect("/login");
};

middlewareObj.checkReviewOwnership = function(req, res, next) {
    if(req.isAuthenticated()){
        Review.findById(req.params.review_id, function(err, foundReview){
            if(err || !foundReview){
                res.redirect("back");
            }  else {
                // does user own the comment?
                if(foundReview.author.id.equals(req.user._id)) {
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
};

middlewareObj.checkReviewExistence = function (req, res, next) {
    if (req.isAuthenticated()) {
        Campground.findById(req.params.id).populate("reviews").exec(function (err, foundCampground) {
            if (err || !foundCampground) {
                req.flash("error", "Campground not found.");
                res.redirect("back");
            } else {
                // check if req.user._id exists in foundCampground.reviews
                var foundUserReview = foundCampground.reviews.some(function (review) {
                    return review.author.id.equals(req.user._id);
                });
                if (foundUserReview) {
                    req.flash("error", "You already wrote a review.");
                    return res.redirect("/campgrounds/" + foundCampground._id);
                }
                // if the review was not found, go to the next middleware
                next();
            }
        });
    } else {
        req.flash("error", "You need to login first.");
        res.redirect("back");
    }
};

module.exports = middlewareObj;