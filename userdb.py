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
    