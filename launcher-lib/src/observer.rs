/// https://github.com/lpxxn/rust-design-pattern/blob/master/behavioral/observer.rs
/// 
///  Traits for implementing Observer pattern 

pub trait Observer {
    fn update(&self, event: String, msg: String);
}

pub trait Subject<'a, T: Observer> {
    fn attach(&mut self, observer: &'a T);
    fn detach(&mut self, observer: &'a T);
    fn inhert(&mut self, observers: Vec<&'a T>);
    fn notify_observers(&self, event: String, msg: String);
}