var express = require("express");
var router = express.Router();   // new instance of the router
var mongoose = require("mongoose");     
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var bodyParser = require('body-parser');
var middleware = require("../middleware");  //it is same as "../middleware/index.js" , since index.js is the special file in the express module
// var geocoder = require('geocoder');
var Review = require("../models/review");

//INDEX - show all campgrounds
router.get("/", function(req, res){     //to show view of all campgrounds
    //Get all campgrounds from DB
    Campground.find({}, function(err, allCampgrounds){
        if(err){
            console.log(err);
        }
        else{
            res.render("campgrounds/index",{campgrounds: allCampgrounds, currentUser: req.user});
        }
    });
});

//CREATE - add new route to database
router.post("/", function(req, res){    //to create new campgrounds
    //get  data from 'form' and add to campgrounds array
    var name = req.body.name;
    var price = req.body.price;
    var image = req.body.image;
    var desc = req.body.description;
    var author = {
        id: req.user._id,
        username: req.user.username
    };
    var reviews = [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Review"
        }
    ];
    var rating = {
        type: Number,
        default: 0
    };

    // geocoder.geocode(req.body.location, function (err, data) {
    //     if (err || data.status === 'ZERO_RESULTS') {
    //       req.flash('error', 'Invalid address');
    //       return res.redirect('back');
    //     }
    //     var lat = data.results[0].geometry.location.lat;
    //     var lng = data.results[0].geometry.location.lng;
    //     var location = data.results[0].formatted_address;
        var newCampground = {name: name, price: price, image: image, description: desc, author: author/*, location: location, lat: lat, lng: lng */};

        //Create a new campground and save to DB
        Campground.create(newCampground, function(err, newlyCreated){
            if(err){
                console.log(err);
            }
            else{
                //redirect back to campgrounds page
                res.redirect("/campgrounds");  //default is redirect as get request (but not sure here)
            }
        });
    // });
});


//NEW - show form to create new campgrounds
router.get("/new", middleware.isLoggedIn, function(req, res){     //should show form that sends data to post route
    res.render("campgrounds/new");
});

// SHOW - shows more info about one campground
router.get("/:id", function (req, res) {
    //find the campground with provided ID
    Campground.findById(req.params.id).populate("comments").populate({
        path: "reviews",
        options: {sort: {createdAt: -1}}
    }).exec(function (err, foundCampground) {
        if (err) {
            console.log(err);
        } else {
            //render show template with that campground
            res.render("campgrounds/show", {campground: foundCampground});
        }
    });
});

// EDIT CAMPGROUND ROUTE
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res){  
    Campground.findById(req.params.id, function(err, foundCampgrounds){
        res.render("campgrounds/edit", {campground: foundCampgrounds});
    });
});

// UPDATE CAMPGROUND ROUTE
router.put("/:id", middleware.checkCampgroundOwnership, function(req, res){
    // geocoder.geocode(req.body.location, function (err, data) {
    //     var lat = data.results[0].geometry.location.lat;
    //     var lng = data.results[0].geometry.location.lng;
    //     var location = data.results[0].formatted_address;
        var newData = {name: req.body.name, image: req.body.image, description: req.body.description, cost: req.body.cost/*, location: location, lat: lat, lng: lng */};
    
        //find and update the correct campground
        Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground){
            if(err){
                console.log(err);
            }
            else{
                //redirect somewhere(show page)
                delete req.body.campground.rating;
                res.redirect("/campgrounds/" + req.params.id);
            }
        });
    // });
});

// DESTROY CAMPGROUND ROUTE
router.delete("/:id", middleware.checkCampgroundOwnership, function (req, res) {
    Campground.findById(req.params.id, function (err, campground) {
        if (err) {
            res.redirect("/campgrounds");
        } else {
            // deletes all comments associated with the campground
            Comment.remove({"_id": {$in: campground.comments}}, function (err) {
                if (err) {
                    console.log(err);
                    return res.redirect("/campgrounds");
                }
                // deletes all reviews associated with the campground
                Review.remove({"_id": {$in: campground.reviews}}, function (err) {
                    if (err) {
                        console.log(err);
                        return res.redirect("/campgrounds");
                    }
                    //  delete the campground
                    campground.remove();
                    req.flash("success", "Campground deleted successfully!");
                    res.redirect("/campgrounds");
                });
            });
        }
    });
});


module.exports = router;