import { useSelector } from 'react-redux'
import Link from 'next/link'

const Footer = () => {
  //const lastUpdate = useSelector((state) => state.timer.lastUpdate)
  
  return (
    <div className="footer">
      Footer
      <Link href="/show-redux-state">
        <a>Redux State</a>
      </Link>
    </div>
  )
}

export default Footer
