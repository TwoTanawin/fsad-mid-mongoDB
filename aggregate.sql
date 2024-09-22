db.orders.insertOne({
    userId: ObjectId("66ef9a8ffce6cea2861681ee"),
    product: "Laptop",
    price: 1000,
    publishDate: new Date("2023-10-25")
  })

  db.orders.aggregate([
  {
    $match: {
      userId: ObjectId("66ef9a8ffce6cea2861681ee")
    }
  },
  {
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "_id",
      as: "userDetails"
    }
  }
])