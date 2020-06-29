using System;
using System.Collections.Generic;

namespace RapidChat
{
    public partial class Peers
    {
        public long Id { get; set; }
        public string PeerId { get; set; }
        public string RoomName { get; set; }

        public Rooms RoomNameNavigation { get; set; }
    }
}
