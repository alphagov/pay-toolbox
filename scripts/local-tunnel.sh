# 9001 admin users  
# 9002 cardid 
# 9003 connector
# 9004 direct debit connector
# 9005 products 
# 9006 publicauth 
# adminusers_db  
# connector_db  
# directdebit-connector_db  
# products_db
# publicauth_db
ssh \
  -L 9001:localhost:9700 \
  -L 9002:localhost:9900 \
  -L 9003:localhost:9300 \
  -L 9004:localhost:10100 \
  -L 9006:localhost:9600 \
  -L 5432:localhost:5432 \
  -L 5432:localhost:5432 \
  -L 5432:localhost:5432 \
  -L 5432:localhost:5432 \
  -L 5432:localhost:5432 \
  localhost
