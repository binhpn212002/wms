import { useDispatch, useSelector } from 'react-redux'
import { Button } from '@/components/ui/button'
import { decrement, increment, reset } from '@/features/counter/counterSlice'

export function HomePage() {
  const count = useSelector((state) => state.counter.value)
  const dispatch = useDispatch()

  return (
    <section className="space-y-4">
      
      <p className="text-muted-foreground">
        Boilerplate da ket noi Redux Toolkit + React Router DOM v6 + Axios + Firebase + shadcn/ui.
      </p>
      <p className="text-2xl font-bold">Counter: {count}</p>
      <div className="flex gap-2">
        <Button onClick={() => dispatch(increment())}>Increment</Button>
        <Button variant="secondary" onClick={() => dispatch(decrement())}>Decrement</Button>
        <Button variant="outline" onClick={() => dispatch(reset())}>Reset</Button>
      </div>
    </section>
  )
}
