import psycopg2 as pg
import psycopg2.extras
import flask_login

class User(flask_login.UserMixin):
    pass


def authenticateUser(dburl,email,password):
    try:
        validUser = False
        conn = pg.connect(dburl)
        cur = conn.cursor()
        cur.execute('SELECT id, email FROM users WHERE email = %s AND password = crypt(%s, password)',(email,password))
        rows = cur.fetchall()
        if cur.rowcount > 0:
            validUser = True
        conn.close()
    except:
        return False
    else:
        return validUser

def userExists(dburl,email):
    try:
        validUser = False
        conn = pg.connect(dburl)
        cur = conn.cursor()
        cur.execute('SELECT id, email FROM users WHERE email = %s',(email,))
        rows = cur.fetchall()
        if cur.rowcount > 0:
            validUser = True
        conn.close()
    except:
        return False
    else:
        return validUser

def userConfirmed(dburl,email):
    try:
        validUser = False
        conn = pg.connect(dburl)
        cur = conn.cursor()
        cur.execute("select id from users where email = %s and accountstatus = 'confirmed'",(email,))
        rows = cur.fetchall()
        if (cur.rowcount > 0):
            validUser = True
    except:
        return validUser
    else:
        return validUser
        
def confirmUser(dburl,confirmationid):
    try:
        validUser = (False,'')
        conn = pg.connect(dburl)
        cur = conn.cursor()
        cur.execute("select email FROM users WHERE confirmationid = %s and accountstatus ='requested'",(confirmationid,))
        rows = cur.fetchall()
        if cur.rowcount > 0:
            email = rows[0][0]
            cur.execute("update users set accountstatus='confirmed' where email = %s and confirmationid = %s",(email,confirmationid))
            conn.commit()
            validUser = (True,email)
        conn.close()
    except:
        return validUser
    else:
        return validUser

def createUser(dburl,email,password,confirmationid):
    try:
        validUser = False
        conn = pg.connect(dburl)
        cur = conn.cursor()
        cur.execute("INSERT INTO users (email, password, accountstatus, confirmationid) VALUES (%s,crypt(%s, gen_salt('bf')),%s,%s)",
            (email,password,'requested',confirmationid))
        conn.commit()
        validUser = True
    except:
        return False
    else:
        cur.close()
        conn.close()
        return validUser
    