const express = require('express')
const { dbConnect } = require('./utiles/db')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
require('dotenv').config()

app.use(cors({
  origin: ['http://127.0.0.1:3000','http://localhost:3000','https://www.shaddyna.com', 'https://shaddyna-dashboard.onrender.com'],
  credentials: true
}))
app.use(bodyParser.json())
app.use(cookieParser())

app.use('/api', require('./routes/authRoutes'))
app.use('/api', require('./routes/dashboard/sellerRoutes'))
app.use('/api', require('./routes/dashboard/categoryRoutes'))
app.use('/api', require('./routes/dashboard/productRoutes'))
app.use('/api', require('./routes/home/customerAuthRoutes'))
app.use('/api/home', require('./routes/home/homeRoutes'))
app.use('/api', require('./routes/home/cardRoutes'))
app.use('/api', require('./routes/paymentRoutes'))
app.use('/api', require('./routes/mpesaRoutes'))
app.use('/api', require('./routes/order/orderRoutes'))
app.use('/api', require('./routes/dashboard/dashboardIndexRoutes'))
app.use('/api', require('./routes/home/dashboardIndexRoutes'))
app.use("/api", require("./routes/bannerRoutes"));

app.get('/', (req, res) => res.send('Shaddyna server Runnning'))

const port = process.env.PORT || 8000

dbConnect()
app.listen(port, () => console.log(`Server is running on port ${port}!`))