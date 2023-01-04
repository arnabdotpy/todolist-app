//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/")

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

var item1 = new Item({
  name: "Welcome to Todo List"
});

var item2 = new Item({
  name: "Hit + to add new items"
});

var item3 = new Item({
  name: "Check items to delete"
});

const defaultItems  = [item1, item2, item3]

const listSchema = {
  name: String,
  item: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res){
    var today = new Date();
    var options = {
       weekday: "long",
       day: "numeric",
       month: "long"
    };
    var day = today.toLocaleDateString("en-US", options);

    Item.find({}, (error, items) => {
      if (items.length === 0){
        Item.insertMany(defaultItems, (e) => {
          if (e){
            console.log(e);
          }
        });
        res.redirect("/");
      } else {
        res.render("list", {listTitle: day, newListItems: items});
      }
    });
});

app.post("/",(req, res) => {
    var newitem = req.body.newItem;
    var listName = req.body.list;
    
    //Day
    var today = new Date();
    var options = {
       weekday: "long",
       day: "numeric",
       month: "long"
    };
    var day = today.toLocaleDateString("en-US", options); //This is the day variable

    //Create Item
    var newItem = Item({
      name: newitem
    });

    //If Block
    if (listName == day) {
      newItem.save();
      setTimeout(function() {
        res.redirect("/")
      }, 50);
    } else {
      List.findOne({name: listName}, (e, foundList) => {
        if (!e){
          foundList.item.push(newItem);
          foundList.save();
          setTimeout(function() {
            res.redirect("/" + listName)
          }, 50);
        };
      });
    }
});

app.get("/:parameter", (req,res) => {
  let customListName = _.capitalize(req.params.parameter);
  List.findOne({name: customListName}, (e, foundList) => {
    if (!e) {
      if (foundList) {
        res.render("list", {listTitle: foundList.name, newListItems: foundList.item});
      } else {
        var list = new List({
          name: customListName,
          item: defaultItems
        });
        list.save();
        res.redirect("/" + customListName)
      }
    }
  })
});

app.post("/delete", (req, res) => {
  var checkedItemId = req.body.checkbox;
  var listName = req.body.listName;

  //Day
  var today = new Date();
  var options = {
     weekday: "long",
     day: "numeric",
     month: "long"
  };
  var day = today.toLocaleDateString("en-US", options); //This is the day variable

  if (listName == day) {
    Item.findByIdAndDelete(checkedItemId, (e) => {
      if (!e) {
        setTimeout(function() {
          res.redirect("/")
        }, 200);
      }
    });
  } else {
    List.findOneAndUpdate(
      {name: listName}, {$pull: {item: {_id: checkedItemId}}}, (err, foundList) => {
        if (!err) {
          res.redirect("/" + listName)
        }
      }
    );
  }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000
}

app.listen(port, function(){
  console.log("Server started on port 3000.");
});
