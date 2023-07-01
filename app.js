require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

// MongoDB Server setup :

mongoose.connect("mongodb+srv://prasad:"+process.env.PASSWORD+"@cluster0.yijpl91.mongodb.net/todolistDB?retryWrites=true&w=majority");

const listSchema = {
    name: String
};
const customListSchema = {
    name: String,
    items: [listSchema]
};

const Item = mongoose.model("Item", listSchema);
const customList = mongoose.model("customList", customListSchema);

const item1 = new Item({
    name: "Welcome to To Do List !"
});
const item2 = new Item({
    name: "Add todays list."
});
const item3 = new Item({
    name: "Check the checkbox after doing it."
});

const defaultList = [item1, item2, item3];


// --------||----------------------------------------------------

const port = 3000;
let workItems = [];
let day = date.getDate();

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {


    Item.find({})
        .then((result) => {
            if (result.length == 0) {
                Item.insertMany(defaultList)
                    .then(() => {
                        console.log("Successfully added default list.");
                    })
                    .catch((err) => {
                        console.log(err);
                    });
                res.redirect("/");

            } else {
                res.render("index", { listHeading: "Today", newAdds: result });
            }

        })
        .catch((err) => {
            console.log(err)
        });
});

app.post("/", (req, res) => {

    let item = req.body.newItem;
    let list = req.body.button;

    const newItem = new Item({
        name: item
    });

    if (list === "Today") {
        newItem.save();
        res.redirect("/");
    } else {
        customList.findOne({ name: list })
            .then((result) => {
                result.items.push(newItem);
                result.save();
                res.redirect("/" + list);
            })
            .catch((err) => {
                console.log(err);
            })
    }


});

app.post("/delete", (req, res) => {
    const checkedId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findByIdAndDelete(checkedId)
            .then((result) => {
                res.redirect("/");
            })
            .catch((err) => {
                console.log(err);
            });
    }
    else{
        customList.findOneAndUpdate({name : listName},{$pull: {items: {_id:checkedId}}})
        .then((result) => {
            res.redirect("/"+ listName);
        })
        .catch((err) => {
            console.log(err);
        });
    }


});

app.get("/:customListName", (req, res) => {
    let customListName = _.capitalize(req.params.customListName);

    if (customListName === "Favicon.ico") {
        return;
    };


    customList.findOne({ name: customListName })
        .then((result) => {
            if (!result) {
                const newCustomList = new customList({
                    name: customListName,
                    items: defaultList
                });
                newCustomList.save();
                res.redirect("/" + customListName);
            } else {
                res.render("index", { listHeading: customListName, newAdds: result.items });
            }
        })
        .catch((err) => {
            console.log(err);
        });

});


app.get("/about", (req, res) => {
    res.render("about")
})

app.listen(port, () => {
    console.log(`Server is online.`)
})