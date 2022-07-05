import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import Link from 'next/link'
import { Table, thead, th, tr, tbody, td, Spinner } from 'react-bootstrap'
import moment from 'moment'
import { ArrowClockwise } from 'react-bootstrap-icons';

//import { startClock } from '../actions'
//import Examples from '../components/examples'
import { getUsers, updateUser } from '../agent'

const Index = () => {
  const [users, setUsers] = useState([])
  const [user, setUser] = useState(null)
  const dispatch = useDispatch()
  /*
  useEffect(() => {
    dispatch(startClock())
  }, [dispatch])
  */
  useEffect(() => {
    (async () => {
      console.log({ hello: 'hello '})
      /*const hello = await hello()
      console.log({ hello })*/
      const json = await getUsers()
      console.log({ json })
      setUsers(json.users)
    })()
  }, [getUsers])

  const onUserUpdate = async ({ user, channel }) => {
    setUser(user)
    console.log({ user })
    console.log({ channel })
    const json = await updateUser({ userName: user, channelName: channel })
    console.log({ json })
    const index = users.findIndex(u => u.user == json.updatedUser.user)
    users.splice(index, 1, json.updatedUser)
    setUser(null)
    setUsers(users)
  }

  return (
    <>
      <div className="app">
        <Table striped bordered hover variant="dark" responsive>
          <thead>
            <tr key="header">
              <th><ArrowClockwise /></th>
              <th>User</th>
              <th>Channel</th>
              <th>Min</th>
              <th>Max</th>
              <th>Avg</th>
              <th>Start</th>
              <th>End</th>
              <th>Update</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => 
              <tr key={u.user}>
                <td className="update-user" key="icon"
                    onClick={() => onUserUpdate({ user: u.user, channel: u.channel })}
                >
                {u.user == user ?
                  <Spinner animation="border" size="sm" />
                  :
                  <ArrowClockwise />
                }
                </td>
                <td>{`@${u.user}`}</td>
                <td>{`#${u.channel}`}</td>
                <td>{u.min}</td>
                <td>{u.max}</td>
                <td>{u.avg}</td>
                <td>{u.start}</td>
                <td>{u.end}</td>
                <td>{moment(u.updatedAt).format('DD-MM-yyyy hh:mm')}</td>
                
              </tr>)
              
            }
            
          </tbody>
        </Table>
      </div>
   
    </>
  )
}

export default Index
