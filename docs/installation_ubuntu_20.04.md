# Stack4Things IoTronic (standalone version) installation guide for Ubuntu 20

We tested this procedure on a Ubuntu 20.04 Everything needs to be run as root.

## Install requirements

##### Install dependencies via apt-get
```
apt update
apt -y install build-essential python-dev-is-python2 python-setuptools libyaml-dev libpython2.7-dev mysql-server nmap apache2 unzip socat bridge-utils python-httplib2 libssl-dev libffi-dev python3-pip
pip3 install -U pyyaml pynacl click cryptography
```

##### Install Crossbar.io router
```
pip3 install crossbar
```

##### Install LTS NodeJS 10 (and npm) distribution:

- NodeJS installation:
```
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
apt-get install -y nodejs
node -v
```
- NPM installation:
```
npm install -g npm
npm config set python `which python2.7`
npm -v
```
- Check if the NODE_PATH variable is not already set:
```
echo $NODE_PATH
```

otherwise, locate the global "node_modules" folder in your system ()usually in "/usr/lib/node_modules" or "/usr/local/lib/node_modules")
and edit the path in the following command:
```
echo "NODE_PATH=/usr/lib/node_modules" | tee -a /etc/environment
. /etc/environment > /dev/null
echo $NODE_PATH
```

## Install IoTronic-standalone

#### Install from source-code

* ##### Install dependencies using npm
```
npm install -g --unsafe log4js@1.1.1 requestify@0.2.5 mysql nconf@0.10.0 ip@1.1.5 express@4.16.4 node-uuid@1.4.8 autobahn@18.10.2 ws@6.1.0 q@1.5.1 body-parser@1.18.3 ps-node@0.1.6 nodemailer@4.6.7 nodemailer-smtp-transport@2.7.4 swagger-jsdoc@7.0.0-rc.6 cors@2.8.4 bcrypt@3.0.6 optimist@0.6.1 jsonwebtoken@8.3.0 md5@2.2.1 crypto@1.0.1
	
npm install -g --unsafe @mdslab/wstun
```

* ##### Setup IoTronic environment
```
mkdir /var/lib/iotronic/
cd $NODE_PATH/@mdslab/

git clone --depth=1 git://github.com/MDSLab/s4t-iotronic-standalone.git ./iotronic-standalone

cp $NODE_PATH/@mdslab/iotronic-standalone/etc/systemd/system/iotronic-standalone.service /etc/systemd/system/
sed -i "s|ExecStart=<IOTRONIC-LAUNCHER>|ExecStart=$NODE_PATH/@mdslab/iotronic-standalone/bin/server|g" /etc/systemd/system/iotronic-standalone.service
chmod +x /etc/systemd/system/iotronic-standalone.service
systemctl daemon-reload
systemctl enable iotronic-standalone.service

mkdir -p /var/lib/iotronic/drivers/
mkdir -p /var/log/iotronic/plugins/
mkdir -p /var/log/wstun/

cp $NODE_PATH/@mdslab/iotronic-standalone/utils/templates/settings.example.json /var/lib/iotronic/settings.json
cp $NODE_PATH/@mdslab/iotronic-standalone/utils/templates/board_settings_template.json /var/lib/iotronic/board_settings_template.json

echo "IOTRONIC_HOME=/var/lib/iotronic" >> /etc/environment
source /etc/environment
echo $IOTRONIC_HOME
```

* ##### Setup Crossbar.io environment
```
cp $NODE_PATH/@mdslab/iotronic-standalone/etc/systemd/system/crossbar.service /etc/systemd/system/
chmod +x /etc/systemd/system/crossbar.service
systemctl daemon-reload
systemctl enable crossbar.service
```


* ##### Configure Websocket reverse tunnel (WSTUN) server
```
cp $NODE_PATH/@mdslab/iotronic-standalone/etc/systemd/system/wstun.service /etc/systemd/system/
chmod +x /etc/systemd/system/wstun.service
systemctl daemon-reload
systemctl enable wstun.service
```

* ##### Import IoTronic-standalone database
You need to import the IoTronic database schema. During the installation of the MySQL package you should have been asked for a database root password. Please note that name of the database is set to "s4t-iotronic". If you want to change it, please consider that later on you will need to correctly change it in other configuration files.
```
mysql -u root -p < $NODE_PATH/@mdslab/iotronic-standalone/utils/s4t-db.sql
```
Register the user root with the password which was choosen before:
```
mysql ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password' flush privileges;
```


## Configure Crossbar.io router
Check the directory of crossbar:
```
crossbar check --cbdir /etc/crossbar
```
Configure Crossbar with SSL:
```
cp $NODE_PATH/@mdslab/iotronic-standalone/etc/crossbar/config.SSL.example.json /etc/crossbar/config.json
vim /etc/crossbar/config.json

    "key": "<PRIVATE-KEY.PEM>",
    "certificate": "<PUBLIC-CERT.PEM>",
    "chain_certificates": [<CHAIN-CERT.PEM>]
```

or without SSL:
```
cp $NODE_PATH/@mdslab/iotronic-standalone/etc/crossbar/config.example.json /etc/crossbar/config.json
```

Please, note that the config[.SSL].example.json coming with the iotronic-standalone package sets the name of the WAMP realm to "s4t" and the Crossbar.io listening port to "8181". If you want to change such values, please consider that later on you will need to correctly change them in other configuration files.



## Configure IoTronic-standalone

Please, note that the settings.example.json coming with the iotronic-standalone package sets the IoTronic listening port to "8888", the database name to "s4t-iotronic" (the database server is supposed to be running locally), the WAMP realm to "s4t" (the Crossbar.io WAMP router is supposed to be running locally on port 8181). If you want to change such values, please consider that later on you will need to correctly change them in other configuration files. 

Open /var/lib/iotronic/settings.json:
- "public_ip": it is the public IP for the Iotronic Admin dashboard
- "api_ip": it is the public IP for Iotronic API REST server
- "http_port": it is the HTTP port of the Iotronic API REST server used if the HTTPS is disabled.
- "https": options used to expose the Iotronic API REST over HTTPS.
- "interface" [deprecated]: specify the NIC (e.g., change <INTERFACE> with "eth0") or the public IP and the port that IoTronic supposed to use to expose its REST interface;
```
"server":
{
        "interface":"<INTERFACE>",
        "public_ip": "<DASHBOARD-PUBLIC-IP>",
        "api_ip":"<API-PUBLIC-IP>",
        "http_port":"<HTTP-API-PORT>",
        "https":{
                "enable":"[ true  | false ]",
                "port":"<HTTPS-API-PORT>",
                "key":"<PATH-PRIVATE-KEY>",
                "cert":"<PATH-PUBLIC-KEY>"
        }
        ...
}
```

 - specify crossabar WAMP broker settings:
 
```
 "wamp":
 {
         "url": "<CROSSBAR-WAMP-URL>",
         "port": "8181",
         "ssl": "[ true | false ]",
         "realm": "s4t",
         "topic_connection": "board.connection",
         "crossbar_pub_ip":"<CROSSBAR-PUBLIC-IP>"
 }
```
```
 - "url": Crossbar WAMP url (e.g. with SSL enabled wss://<CROSSBAR-IP> or ws://<CROSSBAR-IP> with SSL disabled)
 
 - "port": Crossbar server port
 
 - "ssl": specify "true" or "false" if the Crossbar server has SSL enabled or disabled.
 
 - "realm": don't change it!
 
 - "topic_connection": don't change it!
 
 - "crossbar_pub_ip": Crossbar pubblic IP; if not used, specify the same Crossbar IP (<CROSSBAR-IP>) specified in the url of the field "url"

 ```
 
 - specify the database password (use the same password you set while installing the MySQL package):
```
"db":{
        "host":"localhost",
        "port":3306,
        "user":"root",
        "password":"<MYSQL-PASSWORD>",
        "db_name": "s4t-iotronic"
}
```

 - set Notify Manager parameters:
```
"notifier":{
        "email": {
                "address": "<SENDER-EMAIL>",
                "password": "<SENDER-PASSWORD-EMAIL>"
                "smtp":{
                        "smtp_server": "<SMTP-MAIL-SERVER>"",
                        "smtp_port": "<SMTP-PORT>"",
                        "smtp_secure": "[ true | false ]"
                }
        },
        "enable_notify":"[ true | false ]",
}
```


 - configure and enable Iotronic modules:
```
"modules": {
        "plugins_manager": {
                "enabled": true
        },
        etc
}
```

each Iotronic module (e.g. "plugins_manager") has a flag "enabled" to set at true or false in order to enable o disable that module.

In particular, the Service Manager module, has to be configured properly (if enabled):

```
"services_manager": {
        "enabled": true,
        "wstun":
        {
                "port_range":{
                        "high":40100,
                        "low": 40001
                },
                "public_ip":""
        }
},
```
- in the "port_range" section you must specify the range (high and low) of the ports used by this module to expose the board services.
- the "public_ip" field is used to specify the public IP exposed by Iotronic that the user uses (with the port assigned by Iotronic) to reach the running service in his board.


Set authentication parameters:
 - create SuperAdmin token ("adminToken" to set below in the settings.json):
```
node $NODE_PATH/@mdslab/iotronic-standalone/utils/createAdminToken.js <PASSWORD>
```
 - open /var/lib/iotronic/settings.json:
```
"auth":{
        "encryptKey": "<ENC-KEY>",
        "adminToken": "<GENERATED-BEFORE>",
        "backend": "iotronic",
        "expire_time": "1h"
        "auth_lr_mode":"basic"
}
```
The "encryptKey" field is a user-defined keyword/password used to encrypt/decrypt the users passwords during authentication procedures.

The "adminToken" field was generated in the previous step and it is considered a token used ONLY by Admin to call the APIs without the need to get a temporary token to attach to each request as well the common users.

The "expire_time" field is expressed in seconds (e.g.: 60) or as string describing a [timespan](https://github.com/zeit/ms) (e.g.: "30m", "2 days", "10h", "7d").
If you decide to express this field in seconds you MUST specify it as integer (e.g. 60 -> 1 minute)
NOT as a string (e.g. "60" -> 60 milliseconds).

Through "auth_lr_mode" field you can set the authentication mode used by Iotronic to authenticate the Lightning-rod istances. The mode supported are:
- "basic": Iotronic check only if the board ID provided by the board is registered in the database. If a second board try to connect through the same board ID, the login will be rejected.
- "password": Iotronic check the password provided by the board during the login procedure. The password is between 4 and 36 char long.
- "certs": Iotronic verify the signature provided by the board, through the public-key of the board that Iotronic saved in the registration phase into the database.

## Start IoTronic-standalone

##### Start services
```
systemctl start crossbar
systemctl start wstun

systemctl status crossbar
systemctl status wstun
```
Now you are ready to start Iotronic:
```
systemctl start iotronic-standalone.service

systemctl status iotronic-standalone.service
```
You can check logs by typing:
```
tail -f /var/log/iotronic/s4t-iotronic.log

and

tail -f /var/log/wstun/wstun.log
```

##### Register Admin user and project

From API you are able to register the Admin user by means of SuperAdmin authorization token:
```
REQUEST:
curl -X POST \
  http(s)://<IOTRONIC-IP>:<PORT>/v1/users/ \
  -H 'cache-control: no-cache' \
  -H 'content-type: application/x-www-form-urlencoded' \
  -H 'x-auth-token: <SUPER-ADMIN-TOKEN>' \
  -d 'username=admin&password=<ADMIN-PASSWORD>&email=<ADMIN-EMAIL>&f_name=<NAME>&l_name=<SURNAME>'

RESPONSE:
{
    "message":"IoTronic user 'admin' successfully created!",
    "result":"SUCCESS"
}

REQUEST:
curl -X POST \
  http(s)://<IOTRONIC-IP>:<PORT>/v1/projects/ \
  -H 'cache-control: no-cache' \
  -H 'content-type: application/x-www-form-urlencoded' \
  -H 'x-auth-token:<SUPER-ADMIN-TOKEN>' \
  -d 'name=Admin&description=Admin%20Project'

RESPONSE:
{
    "message": "IoTronic project 'Admin' successfully created!",
    "result": "SUCCESS"
}
```



## API documentation management
IoTronic releases its APIs documentation by means of Swagger framework. In particular we used ["swagger-jsdoc"](https://www.npmjs.com/package/swagger-jsdoc) and ["swagger-ui"](https://swagger.io/swagger-ui/)
respectively to describe each RESTful API in the source code and publish the produced documentation.

Iotronic is able to expose the documentation:
 1. embedded mode: generate and expose runtime the API documentation
 2. exposed mode: only specify the URLs of the web-server that is exposing the documentation

In both cases we need to get the "swagger-ui" cloning the git repository from [here](https://github.com/swagger-api/swagger-ui)
 and rename the "dist/" folder in "iotronic-api-docs/".

#### 1. Embedded mode
```
"docs": {

        "embedded":{
                "enable": true,
                "path": "<SWAGGER-DIST-PATH>"
        },
        "exposed":{
                "enable": false,
                "url":"",
                "url_spec":""
        }

}

```
We have to move the "iotronic-api-docs/" folder in the "/var/lib/iotronic/docs/" and we need to specify it inside the
"settings.json" configuration file, as showed above, in the "path" section substituting "<SWAGGER-DIST-PATH>" variable
and setting to "true" the "enable" flag in the "embedded" section.

The API documentation will be available at:
```
http(s)://<IOTRONIC-IP>:<HTTP(S)-API-PORT>/v1/iotronic-api-docs/    (<URL-API-DOCS>)
```
and the location of the Swagger JSON file will be:
```
http(s)://<IOTRONIC-IP>:<HTTP(S)-API-PORT>/v1/iotronic-swagger.json     (<URL-SWAGGER-JSON>)
```


#### 2. Exposed mode
```
"docs": {

        "embedded":{
                "enable": false,
                "path": "<SWAGGER-DIST-PATH>"
        },
        "exposed":{
                "enable": true,
                "url":"<URL-API-DOCS>",
                "url_spec":"<URL-SWAGGER-JSON>"
        }

}

```
In this case we have to
1. move the "iotronic-api-docs/" folder in the web-server public folder to expose the "swagger-ui" (e.g. in Apache we
have to move "iotronic-api-docs/" in "/var/www/html/");
2. generate the swagger json file "iotronic-swagger.json" executing the the script "iotronic-docs-gen.js" provided
by Iotronic in the "docs/" folder; e.g.:
```
node iotronic-docs-gen.js --iotronic=$NODE_PATH"/@mdslab/iotronic-standalone/" -e false -w /var/www/html/iotronic-api-docs/
```
For more information see the below section "Standalone API management".

3. configure the "settings.json" configuration file:
- set to "true" the "enable" flag in the "exposed" section;
- specify the urls of the documentation (<URL-API-DOCS>) and the url that exposes the "iotronic-swagger.json" file
(<URL-SWAGGER-JSON>);

The API documentation will be available at:
```
http(s)://<WEB-SERVER-URL>/iotronic-api-docs/   (<URL-API-DOCS>)
```
and the location of the Swagger JSON file will be:
```
http(s)://<WEB-SERVER-URL>/iotronic-api-docs/iotronic-swagger.json   (<URL-SWAGGER-JSON>)
```


In both the cases you have to edit the "index.html" in <SWAGGER-DIST-PATH> as described in the
[official guide](https://swagger.io/docs/swagger-tools/#download-33):
```
window.swaggerUi = new SwaggerUi({
 url: <URL-SWAGGER-JSON>,
…
});
```
[Link to Official guide](https://swagger.io/docs/swagger-tools/#download-33)




#### Standalone API management
We also provided a NodeJS script ([iotronic-docs-gen.js](iotronic-docs-gen.js)) to do that without using directly
IoTronic or a web-server. This script will generate the documentation and will publish it by means of "swagger-ui".

Script usage:
```
node iotronic-docs-gen.js --iotronic="<IOTRONIC_SOURCE_CODE_PATH>" -e [true|false] [ -p <API_DOCS_PORT> ] [ -w <SWAGGER-JSON-SAVE-PATH>]
```
options:
 - -i, --iotronic  IoTronic suorce code path. (e.g. "$NODE_PATH/@mdslab/iotronic-standalone/")
 - -e, --embedded  true | false to spawn API webpage documentation; if "false" the "iotronic-swagger.json" will be created in the <SWAGGER-DIST-PATH> folder specified in the "settings.json" file in the "docs" section.
 - -p, --port      [only with --embedded=true] Listening port. (this port has to be different from the ports used by IoTronic "http(s)_port")
 - -w, --web       Web server path: where will be created the swagger json file "iotronic-swagger.json".

The docs will be available at:
```
<URL-API-DOCS> = http(s)://<IOTRONIC-IP>:<API_DOCS_PORT>/iotronic-api-docs/
```
and the location of the Swagger JSON file will be:
```
<URL-SWAGGER-JSON> = http(s)://<IOTRONIC-IP>:<HTTP(S)-API-PORT>/iotronic-api-docs/iotronic-swagger.json
```


## Administration dashboard
In order to install the admin dashboard follow this [guide](https://github.com/MDSLab/s4t-iotronic-webinterface).